import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/modules/user/user.model';
import Product from '../src/modules/product/product.model';
import Sale from '../src/modules/sale/sale.model';
import Brand from '../src/modules/brand/brand.model';
import Category from '../src/modules/category/category.model';
import Seller from '../src/modules/seller/seller.model';
import Purchase from '../src/modules/purchase/purchase.model';

dotenv.config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not defined in .env file!');
  process.exit(1);
}

const seedData = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB Atlas...');

    // 1. Create or Find User
    let user = await User.findOne({ email: 'neelghantala@gmail.com' });
    if (!user) {
      user = await User.create({
        name: 'Neel',
        email: 'neelghantala@gmail.com',
        password: 'Neel123', // Automatically hashed by User model pre-save hook
        role: 'USER',
        status: 'ACTIVE'
      });
      console.log('Created user neelghantala@gmail.com.');
    } else {
      console.log('User neelghantala@gmail.com already exists.');
    }
    const userId = user._id;

    // Clean existing data and reset collections to clear stale/duplicate indexes like "sku_1"
    console.log('Cleaning existing data and dropping collections to reset indexes...');
    
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      const toDrop = ['products', 'sales', 'brands', 'categories', 'sellers', 'purchases'];
      for (const col of toDrop) {
        if (collectionNames.includes(col)) {
          await db.dropCollection(col);
          console.log(`Dropped collection: ${col}`);
        }
      }
    }

    // Trigger Mongoose to rebuild indexes for the active models
    console.log('Rebuilding indexes...');
    await Product.init();
    await Sale.init();
    await Brand.init();
    await Category.init();
    await Seller.init();
    await Purchase.init();

    // 2. Create Categories
    console.log('Seeding Categories...');
    const catElectronics = await Category.create({ name: 'Electronics', user: userId });
    const catAccessories = await Category.create({ name: 'Accessories', user: userId });
    const catOffice = await Category.create({ name: 'Office Supplies', user: userId });

    // 3. Create Brands
    console.log('Seeding Brands...');
    const brandDell = await Brand.create({ name: 'Dell', user: userId });
    const brandSony = await Brand.create({ name: 'Sony', user: userId });
    const brandLogitech = await Brand.create({ name: 'Logitech', user: userId });
    const brandHP = await Brand.create({ name: 'HP', user: userId });

    // 4. Create Sellers
    console.log('Seeding Sellers...');
    const sellerApex = await Seller.create({ name: 'Apex Suppliers', email: 'apex@suppliers.com', contactNo: '+1-555-0101', user: userId });
    const sellerMega = await Seller.create({ name: 'Mega Store', email: 'mega@store.com', contactNo: '+1-555-0202', user: userId });
    const sellerGlobex = await Seller.create({ name: 'Globex Logistics', email: 'globex@logistics.com', contactNo: '+1-555-0303', user: userId });

    // 5. Create Products
    console.log('Seeding Products...');
    const productsData = [
      { name: 'Dell XPS 15', skuId: 'LAP-XPS15', price: 120000, stock: 15, size: 'MEDIUM', brand: brandDell._id, category: catElectronics._id, seller: sellerApex._id, description: 'Premium 15-inch laptop with OLED display' },
      { name: 'Sony WH-1000XM4', skuId: 'AUD-WH1000', price: 25000, stock: 8, size: 'SMALL', brand: brandSony._id, category: catElectronics._id, seller: sellerMega._id, description: 'Industry leading noise cancelling headphones' },
      { name: 'Logitech MX Master 3S', skuId: 'ACC-MXMST3', price: 9500, stock: 45, size: 'SMALL', brand: brandLogitech._id, category: catAccessories._id, seller: sellerGlobex._id, description: 'Ergonomic office wireless mouse' },
      { name: 'HP Pavilion 27 Monitor', skuId: 'MON-HP27', price: 22000, stock: 4, size: 'LARGE', brand: brandHP._id, category: catOffice._id, seller: sellerApex._id, description: '27-inch IPS display with micro-edge bezels' },
      { name: 'Sony PlayStation 5', skuId: 'GAM-PS5', price: 55000, stock: 12, size: 'LARGE', brand: brandSony._id, category: catElectronics._id, seller: sellerMega._id, description: 'Next-gen gaming console with Ultra HD Blu-ray' },
      { name: 'Dell OptiPlex Desktop', skuId: 'DESK-OPTIP', price: 75000, stock: 35, size: 'MEDIUM', brand: brandDell._id, category: catElectronics._id, seller: sellerApex._id, description: 'Compact business desktop computer' },
      { name: 'HP Laser Jet Printer', skuId: 'PRN-HPLJ', price: 18000, stock: 28, size: 'LARGE', brand: brandHP._id, category: catOffice._id, seller: sellerGlobex._id, description: 'High-speed monochrome laser printer' },
      { name: 'Logitech G Pro Keyboard', skuId: 'ACC-GPROKB', price: 12500, stock: 50, size: 'SMALL', brand: brandLogitech._id, category: catAccessories._id, seller: sellerGlobex._id, description: 'Tenkeyless mechanical gaming keyboard' },
      { name: 'USB-C Hub Multiport', skuId: 'ACC-USBCHUB', price: 3500, stock: 120, size: 'SMALL', brand: brandLogitech._id, category: catAccessories._id, seller: sellerMega._id, description: '8-in-1 USB-C adapter hub' },
      { name: 'Sony Alpha 7 IV Camera', skuId: 'CAM-A7M4', price: 180000, stock: 6, size: 'MEDIUM', brand: brandSony._id, category: catElectronics._id, seller: sellerApex._id, description: 'Full-frame hybrid mirrorless camera' }
    ];

    const products: any[] = [];
    for (const item of productsData) {
      const prod = await Product.create({ ...item, user: userId });
      products.push(prod);
    }

    // 6. Create Sales (Spread out in August 2026 for charts)
    console.log('Seeding Sales...');
    const buyers = ['Rohan Patel', 'Aarav Shah', 'Pooja Sharma', 'Aditya Mehta', 'Kavita Joshi', 'Rahul Dave', 'Sneha Vyas'];
    const salesData = [
      { productIndex: 0, buyer: buyers[0], qty: 2, daysAgo: 5 },
      { productIndex: 1, buyer: buyers[1], qty: 1, daysAgo: 4 },
      { productIndex: 2, buyer: buyers[2], qty: 3, daysAgo: 4 },
      { productIndex: 3, buyer: buyers[3], qty: 1, daysAgo: 3 },
      { productIndex: 4, buyer: buyers[4], qty: 2, daysAgo: 3 },
      { productIndex: 5, buyer: buyers[5], qty: 1, daysAgo: 2 },
      { productIndex: 6, buyer: buyers[6], qty: 2, daysAgo: 2 },
      { productIndex: 7, buyer: buyers[0], qty: 1, daysAgo: 1 },
      { productIndex: 8, buyer: buyers[1], qty: 5, daysAgo: 1 },
      { productIndex: 9, buyer: buyers[2], qty: 1, daysAgo: 0 },
      { productIndex: 2, buyer: buyers[3], qty: 2, daysAgo: 0 },
      { productIndex: 8, buyer: buyers[4], qty: 4, daysAgo: 0 },
      { productIndex: 0, buyer: buyers[5], qty: 1, daysAgo: 6 },
      { productIndex: 4, buyer: buyers[6], qty: 1, daysAgo: 6 },
      { productIndex: 7, buyer: buyers[0], qty: 2, daysAgo: 7 },
      { productIndex: 3, buyer: buyers[1], qty: 1, daysAgo: 7 }
    ];

    for (const item of salesData) {
      const targetProd = products[item.productIndex];
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - item.daysAgo);

      await Sale.create({
        user: userId,
        product: targetProd._id,
        buyerName: item.buyer,
        productName: targetProd.name,
        quantity: item.qty,
        productPrice: targetProd.price,
        totalPrice: targetProd.price * item.qty,
        date: saleDate
      });
    }

    // 7. Create Purchases
    console.log('Seeding Purchases...');
    const purchaseData = [
      { productIndex: 0, qty: 10, seller: sellerApex },
      { productIndex: 1, qty: 15, seller: sellerMega },
      { productIndex: 3, qty: 5, seller: sellerApex },
      { productIndex: 6, qty: 20, seller: sellerGlobex },
      { productIndex: 9, qty: 4, seller: sellerApex }
    ];

    for (const item of purchaseData) {
      const targetProd = products[item.productIndex];
      await Purchase.create({
        user: userId,
        product: targetProd._id,
        seller: item.seller._id,
        sellerName: item.seller.name,
        productName: targetProd.name,
        quantity: item.qty,
        unitPrice: targetProd.price * 0.8, // purchased at 20% discount
        totalPrice: (targetProd.price * 0.8) * item.qty,
        paid: (targetProd.price * 0.8) * item.qty
      });
    }

    console.log('🎉 Seeding successfully completed for user neelghantala@gmail.com!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
