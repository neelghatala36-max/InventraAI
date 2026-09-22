import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import User from '../src/modules/user/user.model';
import Product from '../src/modules/product/product.model';
import Sale from '../src/modules/sale/sale.model';
import Brand from '../src/modules/brand/brand.model';
import Category from '../src/modules/category/category.model';
import Seller from '../src/modules/seller/seller.model';
import Purchase from '../src/modules/purchase/purchase.model';

dotenv.config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/inventory';

const importData = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');

    const datasetDir = path.join(__dirname, '../../Dataset');

    // 1. Get existing user or use a dummy ObjectId
    const user = await User.findOne();
    const userId = user ? user._id : new mongoose.Types.ObjectId();
    console.log(`Using user ID: ${userId} for relations (does not modify User collection)`);

    // Helper to clear and import raw collections (Customers, Promotions)
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection did not initialize db object.');
    }

    // 2. Import Customers (bm_customers.csv)
    console.log('Importing Customers...');
    const customersColl = db.collection('customers');
    await customersColl.deleteMany({});
    let customersBatch: any[] = [];
    const customersStream = fs.createReadStream(path.join(datasetDir, 'bm_customers.csv')).pipe(csv());
    let importedCustomersCount = 0;
    for await (const row of customersStream) {
      customersBatch.push({
        customerId: row.cust_id,
        age: parseInt(row.age) || null,
        gender: row.gender,
        city: row.city,
        loyaltySegment: row.loyalty_segment,
        preferredChannel: row.preferred_channel,
        registrationDate: row.registration_date ? new Date(row.registration_date) : null
      });
      if (customersBatch.length >= 1000) {
        await customersColl.insertMany(customersBatch);
        importedCustomersCount += customersBatch.length;
        customersBatch = [];
      }
    }
    if (customersBatch.length > 0) {
      await customersColl.insertMany(customersBatch);
      importedCustomersCount += customersBatch.length;
    }
    console.log(`Successfully imported ${importedCustomersCount} customers.`);

    // 3. Import Promotions (bm_promotions.csv)
    console.log('Importing Promotions...');
    const promotionsColl = db.collection('promotions');
    await promotionsColl.deleteMany({});
    let promotionsBatch: any[] = [];
    const promotionsStream = fs.createReadStream(path.join(datasetDir, 'bm_promotions.csv')).pipe(csv());
    let importedPromotionsCount = 0;
    for await (const row of promotionsStream) {
      promotionsBatch.push({
        promoId: row.promo_id,
        promoName: row.promo_name,
        startDate: row.start_date ? new Date(row.start_date) : null,
        endDate: row.end_date ? new Date(row.end_date) : null,
        discountPct: parseFloat(row.discount_pct) || 0,
        promoType: row.promo_type
      });
    }
    if (promotionsBatch.length > 0) {
      await promotionsColl.insertMany(promotionsBatch);
      importedPromotionsCount += promotionsBatch.length;
    }
    console.log(`Successfully imported ${importedPromotionsCount} promotions.`);

    // 4. Import Stores as Sellers
    console.log('Importing Stores...');
    const storesMap = new Map(); // store_id -> seller_id
    const storesStream = fs.createReadStream(path.join(datasetDir, 'bm_stores.csv')).pipe(csv());
    let importedStoresCount = 0;
    for await (const row of storesStream) {
      let seller = await Seller.findOne({ name: row.store_name });
      if (!seller) {
        seller = await Seller.create({
          user: userId,
          name: row.store_name,
          email: `${row.store_name.toLowerCase().replace(/ /g, '.')}@bluemart.com`,
          contactNo: '0000000000'
        });
        importedStoresCount++;
      }
      storesMap.set(row.store_id, seller._id);
    }
    console.log(`Imported/Found ${storesMap.size} stores. Created ${importedStoresCount} new store/seller records.`);

    // 5. Import Categories and Brands from SKUs
    console.log('Importing Categories and Brands...');
    const categoriesMap = new Map();
    const brandsMap = new Map();
    const skusForProducts: any[] = [];
    const skusStream = fs.createReadStream(path.join(datasetDir, 'bm_skus.csv')).pipe(csv());
    for await (const row of skusStream) {
      if (!categoriesMap.has(row.category)) {
        let cat = await Category.findOne({ name: row.category });
        if (!cat) {
          cat = await Category.create({ user: userId, name: row.category });
        }
        categoriesMap.set(row.category, cat._id);
      }
      if (!brandsMap.has(row.brand)) {
        let br = await Brand.findOne({ name: row.brand });
        if (!br) {
          br = await Brand.create({ user: userId, name: row.brand });
        }
        brandsMap.set(row.brand, br._id);
      }
      skusForProducts.push(row);
    }

    // 6. Import Products
    console.log('Importing Products...');
    const productsMap = new Map(); // sku_id -> product_id
    let importedProductsCount = 0;
    for (const row of skusForProducts) {
      let product = await Product.findOne({ skuId: row.sku_id });
      if (!product) {
        product = await Product.create({
          user: userId,
          skuId: row.sku_id,
          name: row.sku_name,
          seller: Array.from(storesMap.values())[0], // Temporary seller (first store)
          category: categoriesMap.get(row.category),
          brand: brandsMap.get(row.brand),
          price: parseFloat(row.unit_price) || 0,
          stock: 0, // Will be updated by inventory
          description: `Category: ${row.category}, Subcategory: ${row.subcategory}`
        });
        importedProductsCount++;
      }
      productsMap.set(row.sku_id, { id: product._id, cost_price: parseFloat(row.cost_price) || 0, name: product.name });
    }
    console.log(`Imported/Found ${productsMap.size} products. Created ${importedProductsCount} new product records.`);

    // 7. Update Inventory and Create Purchases
    console.log('Updating Inventory and Creating Purchases...');
    const inventoryStream = fs.createReadStream(path.join(datasetDir, 'bm_inventory.csv')).pipe(csv());
    const productStockUpdate = new Map(); // sku_id -> total_stock
    const purchasesToInsert: any[] = [];
    let importedInventoryCount = 0;

    // Cache seller names to avoid repeated database queries in the loop
    const sellerNamesCache = new Map();
    for (const [storeId, sellerId] of storesMap.entries()) {
      const sellerDoc = await Seller.findById(sellerId);
      sellerNamesCache.set(sellerId.toString(), sellerDoc?.name || 'Unknown');
    }

    for await (const row of inventoryStream) {
      const skuId = row.sku_id;
      const stock = parseInt(row.stock_on_hand) || 0;
      const storeId = row.store_id;
      
      productStockUpdate.set(skuId, (productStockUpdate.get(skuId) || 0) + stock);
      importedInventoryCount++;

      const productData = productsMap.get(skuId);
      const sellerId = storesMap.get(storeId);

      if (productData && sellerId) {
        purchasesToInsert.push({
          user: userId,
          seller: sellerId,
          product: productData.id,
          sellerName: sellerNamesCache.get(sellerId.toString()) || 'Unknown',
          productName: productData.name,
          quantity: stock,
          unitPrice: productData.cost_price,
          totalPrice: stock * productData.cost_price,
          paid: stock * productData.cost_price,
          createdAt: new Date(row.last_restock_date)
        });
      }
    }

    // Batch update product stock
    for (const [skuId, totalStock] of productStockUpdate.entries()) {
      await Product.updateOne({ skuId }, { stock: totalStock });
    }

    // Clear existing purchases from this script run to prevent duplication
    await Purchase.deleteMany({ user: userId });

    if (purchasesToInsert.length > 0) {
        const BATCH_SIZE = 1000;
        for (let i = 0; i < purchasesToInsert.length; i += BATCH_SIZE) {
            await Purchase.insertMany(purchasesToInsert.slice(i, i + BATCH_SIZE));
        }
    }
    console.log(`Updated stock for ${productStockUpdate.size} products. Created ${purchasesToInsert.length} purchase records from ${importedInventoryCount} inventory items.`);

    // 8. Import Sales
    console.log('Importing Sales...');
    await Sale.deleteMany({ user: userId }); 

    let salesBatch: any[] = [];
    const SALES_BATCH_SIZE = 2000;
    let totalSalesImported = 0;
    const salesStream = fs.createReadStream(path.join(datasetDir, 'bm_sales.csv')).pipe(csv());

    for await (const row of salesStream) {
      const productData = productsMap.get(row.sku_id);
      if (productData) {
        salesBatch.push({
          user: userId,
          product: productData.id,
          buyerName: row.customer_id ? `Customer ${row.customer_id}` : 'Walk-in Customer',
          productName: productData.name,
          quantity: parseInt(row.quantity) || 0,
          totalPrice: parseFloat(row.total_value) || 0,
          productPrice: parseFloat(row.unit_price) || 0,
          date: new Date(row.date)
        });
      }

      if (salesBatch.length >= SALES_BATCH_SIZE) {
        await Sale.insertMany(salesBatch);
        totalSalesImported += salesBatch.length;
        console.log(`Imported ${totalSalesImported} sales...`);
        salesBatch = [];
      }
    }
    if (salesBatch.length > 0) {
      await Sale.insertMany(salesBatch);
      totalSalesImported += salesBatch.length;
    }
    console.log(`Successfully imported ${totalSalesImported} sales.`);

    console.log('--------------------------------------------');
    console.log('Migration completed successfully.');
    console.log(`- Customers: ${importedCustomersCount}`);
    console.log(`- Promotions: ${importedPromotionsCount}`);
    console.log(`- Stores: ${storesMap.size}`);
    console.log(`- Products: ${productsMap.size}`);
    console.log(`- Inventory Items Processed: ${importedInventoryCount}`);
    console.log(`- Purchases Generated: ${purchasesToInsert.length}`);
    console.log(`- Sales Records: ${totalSalesImported}`);
    console.log('--------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

importData();
