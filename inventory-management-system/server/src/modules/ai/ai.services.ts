import mongoose from 'mongoose';
import config from '../../config';
import Product from '../product/product.model';
import Sale from '../sale/sale.model';
import Brand from '../brand/brand.model';
import Category from '../category/category.model';
import Seller from '../seller/seller.model';
import Purchase from '../purchase/purchase.model';

interface ICopilotRequest {
  message: string;
  userId: string;
  history?: Array<{ sender: 'user' | 'bot'; text: string }>;
}

export const askCopilotService = async ({ message, userId, history = [] }: ICopilotRequest) => {
  const cleanMessage = message.trim();
  const lowerMsg = cleanMessage.toLowerCase();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Parallel 360° Data Fetching across all Inventory, Sales, Customers, Purchases, and Suppliers
  const [
    products,
    sellers,
    brands,
    categories,
    customerSpendingAggregate,
    supplierPurchaseAggregate,
    topProductsAggregate,
    totalSalesAggregate,
    totalPurchasesAggregate,
    recentSales,
    recentPurchases
  ] = await Promise.all([
    // Products with Brand, Category & Seller populated
    Product.find({ user: userObjectId })
      .populate('brand', 'name')
      .populate('category', 'name')
      .populate('seller', 'name')
      .lean(),

    // Registered Sellers / Suppliers
    Seller.find({ user: userObjectId }).lean(),

    // Brands
    Brand.find({ user: userObjectId }).lean(),

    // Categories
    Category.find({ user: userObjectId }).lean(),

    // Customer / Buyer Spending & Purchase Breakdown
    Sale.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$buyerName',
          totalSpent: { $sum: '$totalPrice' },
          totalUnitsBought: { $sum: '$quantity' },
          orderCount: { $sum: 1 },
          purchases: {
            $push: {
              productName: '$productName',
              quantity: '$quantity',
              totalPrice: '$totalPrice',
              productPrice: '$productPrice',
              date: '$date'
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]),

    // Supplier / Purchase Breakdown
    Purchase.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$sellerName',
          totalPurchaseCost: { $sum: '$totalPrice' },
          totalUnitsPurchased: { $sum: '$quantity' },
          purchaseCount: { $sum: 1 },
          items: {
            $push: {
              productName: '$productName',
              quantity: '$quantity',
              unitPrice: '$unitPrice',
              totalPrice: '$totalPrice',
              paid: '$paid',
              date: '$createdAt'
            }
          }
        }
      },
      { $sort: { totalPurchaseCost: -1 } }
    ]),

    // Top Selling Products
    Sale.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: '$productName',
          totalSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]),

    // Total Sales Summary
    Sale.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          totalSalesUnits: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalPrice' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]),

    // Total Purchases Summary
    Purchase.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          totalPurchaseUnits: { $sum: '$quantity' },
          totalPurchaseCost: { $sum: '$totalPrice' },
          totalPaid: { $sum: '$paid' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]),

    // Recent Sales
    Sale.find({ user: userObjectId }).sort({ date: -1, createdAt: -1 }).limit(20).lean(),

    // Recent Purchases
    Purchase.find({ user: userObjectId }).sort({ createdAt: -1 }).limit(20).lean()
  ]);

  // Derived Financial & Inventory Metrics
  const totalProductsCount = products.length;
  const totalStockCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock || 0) * (p.price || 0), 0);
  const totalRevenue = totalSalesAggregate[0]?.totalRevenue || 0;
  const totalSalesUnits = totalSalesAggregate[0]?.totalSalesUnits || 0;
  const totalSalesCount = totalSalesAggregate[0]?.totalTransactions || 0;
  const totalPurchaseCost = totalPurchasesAggregate[0]?.totalPurchaseCost || 0;
  const totalPurchaseUnits = totalPurchasesAggregate[0]?.totalPurchaseUnits || 0;
  const grossProfitEstimate = totalRevenue - totalPurchaseCost;

  // Stock Thresholds
  const numMatch = lowerMsg.match(/\b(\d+)\b/);
  const threshold = numMatch ? parseInt(numMatch[1], 10) : 10;
  const lowStockProducts = products.filter(p => p.stock < threshold);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  // 2. Try Google Gemini Generative AI (Live 360° Context Injection)
  if (config.gemini_api_key) {
    try {
      const geminiReply = await callGeminiApi({
        message: cleanMessage,
        history,
        context: {
          storeOverview: {
            totalRevenue,
            totalSalesUnits,
            totalSalesTransactions: totalSalesCount,
            totalPurchaseCost,
            totalPurchaseUnits,
            grossProfitEstimate,
            totalInventoryValuation: totalInventoryValue,
            totalProductCatalogCount: totalProductsCount,
            totalStockInWarehouse: totalStockCount,
            outOfStockCount: outOfStockProducts.length,
            lowStockCount: lowStockProducts.length
          },
          customersAndBuyers: customerSpendingAggregate.map(c => ({
            customerName: c._id,
            totalAmountSpent: c.totalSpent,
            totalUnitsBought: c.totalUnitsBought,
            orderCount: c.orderCount,
            purchaseHistory: c.purchases
          })),
          suppliersAndPurchases: supplierPurchaseAggregate.map(s => ({
            supplierName: s._id,
            totalExpenseToSupplier: s.totalPurchaseCost,
            totalUnitsPurchased: s.totalUnitsPurchased,
            purchaseRecords: s.items
          })),
          registeredSuppliers: sellers.map(s => ({
            name: s.name,
            email: s.email || 'N/A',
            contactNo: s.contactNo
          })),
          topSellingProducts: topProductsAggregate,
          lowStockAlerts: lowStockProducts.map(p => ({
            name: p.name,
            skuId: p.skuId,
            stock: p.stock,
            price: p.price,
            brand: (p.brand as any)?.name || 'N/A',
            category: (p.category as any)?.name || 'N/A'
          })),
          allProductsCatalog: products.map(p => ({
            name: p.name,
            skuId: p.skuId,
            stock: p.stock,
            price: p.price,
            brand: (p.brand as any)?.name || 'N/A',
            category: (p.category as any)?.name || 'N/A',
            supplier: (p.seller as any)?.name || 'N/A'
          })),
          recentSalesLog: recentSales.map(s => ({
            buyer: s.buyerName,
            product: s.productName,
            qty: s.quantity,
            total: s.totalPrice,
            date: s.date
          }))
        }
      });

      if (geminiReply) {
        return {
          reply: geminiReply,
          source: 'gemini',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('Gemini API call error, engaging smart local NLP fallback engine:', error);
    }
  }

  // 3. Smart Multilingual Natural Language Local Fallback Engine
  const smartReply = resolveSmartNlpQuery({
    lowerMsg,
    cleanMessage,
    products,
    brands,
    topProducts: topProductsAggregate,
    customers: customerSpendingAggregate,
    suppliers: supplierPurchaseAggregate,
    totalRevenue,
    totalSalesUnits,
    totalInventoryValue,
    totalProductsCount,
    totalPurchaseCost,
    threshold,
    lowStockProducts
  });

  return {
    reply: smartReply,
    source: 'nlp_engine',
    timestamp: new Date().toISOString()
  };
};

/**
 * Call Google Gemini Generative AI REST API with 360° Real-time Context & Automatic Retry
 */
async function callGeminiApi({
  message,
  history,
  context
}: {
  message: string;
  history: Array<{ sender: 'user' | 'bot'; text: string }>;
  context: any;
}) {
  const systemPrompt = `You are "Inventra AI Copilot", an elite AI copilot for InventraAI with full 360-degree real-time visibility into the user's inventory, sales, customer purchase profiles, suppliers, purchases, and profit metrics.

Live Database Snapshot of the user:
${JSON.stringify(context, null, 2)}

Response Layout Guidelines:
1. High-Impact Visual Structure:
   - Start with a clear section header e.g. "### 👤 Customer Spending Profile: [Name]" or "### 📊 Inventory & Sales Overview"
   - Provide a quick 1-2 sentence executive summary highlighting key figures (Total Spend, Total Units, Order Count).
   - When presenting multiple items, orders, or products, ALWAYS use a clean Markdown Table:
     | Date | Product Name | Quantity | Unit Price | Total Amount |
   - Include a final "Total" summary row in the table.
2. Insights & Analytics:
   - Include a "### 🔍 Loyalty & Purchasing Insights" or "### 📈 Product Velocity Analysis" section with concise, high-value bullet points.
3. Actionable Strategy:
   - ALWAYS conclude with an eye-catching recommendation prefixed with "💡 **Recommendation:**". Give specific cross-selling, restocking, or vendor negotiation strategies.
4. Currency & Language:
   - Format all currency in Indian Rupees with symbol and Indian numbering format (e.g., **₹1,95,000**, **₹22,000**).
   - Understand queries in English, Gujarati (ગુજરાતી), and Gujlish, and reply in clean, structured English.`;

  const contents: any[] = [];

  // Add conversation history if available
  for (const h of history.slice(-4)) {
    contents.push({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const models = ['gemini-3.6-flash', 'gemini-flash-latest'];

  for (const modelName of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.gemini_api_key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }]
              },
              contents,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000
              }
            })
          }
        );

        if (response.ok) {
          const data: any = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply;
        }

        if (response.status === 503 || response.status === 429) {
          // Wait 1s and retry once
          await new Promise(res => setTimeout(res, 1000));
          continue;
        } else {
          const errText = await response.text();
          console.warn(`Gemini API error ${response.status} on ${modelName}:`, errText);
          break;
        }
      } catch (err) {
        console.warn(`Attempt ${attempt + 1} failed for ${modelName}:`, err);
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  return null;
}

/**
 * Transliterate Gujarati keywords to standard Latin/English tokens
 */
function normalizeGujaratiText(text: string): string {
  let normalized = text.toLowerCase();
  const gujMap: Record<string, string> = {
    'રાહુલ': 'rahul',
    'દવે': 'dave',
    'રોહન': 'rohan',
    'પટેલ': 'patel',
    'આરવ': 'aarav',
    'શાહ': 'shah',
    'પૂજા': 'pooja',
    'શર્મા': 'sharma',
    'આદિત્ય': 'aditya',
    'મહેતા': 'mehta',
    'કવિતા': 'kavita',
    'જોશી': 'joshi',
    'સ્નેહા': 'sneha',
    'વ્યાસ': 'vyas',
    'નીલ': 'neel',
    'ઘાંટાલા': 'ghantala',
    'ખરીદ્યો': 'spent',
    'ખરીદી': 'purchase',
    'ગ્રાહક': 'customer',
    'રૂપિયા': 'rupees',
    'સામાન': 'product',
    'સ્ટોક': 'stock',
    'ઓછો': 'low stock'
  };

  for (const [guj, eng] of Object.entries(gujMap)) {
    normalized = normalized.split(guj).join(eng);
  }
  return normalized;
}

/**
 * Deterministic Multilingual NLP Query Resolver (Local Fallback Engine)
 */
function resolveSmartNlpQuery({
  lowerMsg,
  cleanMessage,
  products,
  brands,
  topProducts,
  customers,
  suppliers,
  totalRevenue,
  totalSalesUnits,
  totalInventoryValue,
  totalProductsCount,
  totalPurchaseCost,
  threshold,
  lowStockProducts
}: {
  lowerMsg: string;
  cleanMessage: string;
  products: any[];
  brands: any[];
  topProducts: any[];
  customers: any[];
  suppliers: any[];
  totalRevenue: number;
  totalSalesUnits: number;
  totalInventoryValue: number;
  totalProductsCount: number;
  totalPurchaseCost: number;
  threshold: number;
  lowStockProducts: any[];
}) {
  const normMsg = normalizeGujaratiText(lowerMsg);

  // Query Type 1: Customer / Buyer Specific Query
  const matchedCustomer = customers.find(c => {
    const name = (c._id || '').toLowerCase();
    const parts = name.split(' ');
    return normMsg.includes(name) || parts.some((p: string) => p.length > 2 && normMsg.includes(p));
  });

  if (
    matchedCustomer ||
    normMsg.includes('customer') ||
    normMsg.includes('buyer') ||
    normMsg.includes('spent') ||
    normMsg.includes('ગ્રાહક') ||
    normMsg.includes('ખરીદનાર')
  ) {
    if (matchedCustomer) {
      let reply = `👤 **Customer Profile: ${matchedCustomer._id}**\n\n`;
      reply += `• **Total Amount Spent:** ₹${matchedCustomer.totalSpent.toLocaleString('en-IN')}\n`;
      reply += `• **Total Items Purchased:** ${matchedCustomer.totalUnitsBought} units across ${matchedCustomer.orderCount} transaction(s)\n\n`;
      reply += `**📋 Purchase Breakdown:**\n`;
      matchedCustomer.purchases.forEach((p: any, idx: number) => {
        reply += `${idx + 1}. **${p.productName}** — ${p.quantity} unit(s) (Subtotal: **₹${p.totalPrice.toLocaleString('en-IN')}**)\n`;
      });
      reply += `\n💡 **Recommendation:** ${matchedCustomer.totalSpent > 100000 ? 'This is a High-Value VIP Customer! Offer loyalty tier discounts or priority corporate support.' : 'Follow up with personalized recommendations for complementary accessories.'}`;
      return reply;
    }

    if (customers.length > 0) {
      let reply = `👥 **Top Spending Customers Overview:**\n\n`;
      customers.slice(0, 5).forEach((c, idx) => {
        reply += `${idx + 1}. **${c._id}** — Total Spent: **₹${c.totalSpent.toLocaleString('en-IN')}** (${c.totalUnitsBought} units)\n`;
      });
      reply += `\n💡 **Recommendation:** Launch targeted loyalty rewards for your top buyers to drive recurring orders.`;
      return reply;
    }
  }

  // Query Type 2: Supplier / Seller / Purchases Query
  const matchedSupplier = suppliers.find(s => {
    const name = (s._id || '').toLowerCase();
    return lowerMsg.includes(name);
  });

  if (
    matchedSupplier ||
    lowerMsg.includes('supplier') ||
    lowerMsg.includes('seller') ||
    lowerMsg.includes('સપ્લાયર') ||
    lowerMsg.includes('ખરીદી') ||
    lowerMsg.includes('purchase')
  ) {
    if (matchedSupplier) {
      let reply = `🏭 **Supplier Profile: ${matchedSupplier._id}**\n\n`;
      reply += `• **Total Purchase Expenses:** ₹${matchedSupplier.totalPurchaseCost.toLocaleString('en-IN')}\n`;
      reply += `• **Total Stock Purchased:** ${matchedSupplier.totalUnitsPurchased} units\n\n`;
      reply += `**Recent Inbound Shipments:**\n`;
      matchedSupplier.items.slice(0, 5).forEach((item: any, idx: number) => {
        reply += `${idx + 1}. **${item.productName}** — ${item.quantity} units (Total: ₹${item.totalPrice.toLocaleString('en-IN')})\n`;
      });
      reply += `\n💡 **Recommendation:** Schedule batch orders with this supplier to negotiate favorable credit terms and wholesale discounts.`;
      return reply;
    }

    if (suppliers.length > 0) {
      let reply = `🏭 **Primary Suppliers & Procurement Overview:**\n\n`;
      suppliers.slice(0, 5).forEach((s, idx) => {
        reply += `${idx + 1}. **${s._id}** — Total Procurement: **₹${s.totalPurchaseCost.toLocaleString('en-IN')}** (${s.totalUnitsPurchased} units)\n`;
      });
      reply += `\n💡 **Recommendation:** Consolidate procurement channels to negotiate tier-1 vendor volume discounts.`;
      return reply;
    }
  }

  // Query Type 3: Top selling products
  if (
    lowerMsg.includes('top') ||
    lowerMsg.includes('વધુ વેચાયેલ') ||
    lowerMsg.includes('સૌથી વધુ') ||
    lowerMsg.includes('most sold') ||
    lowerMsg.includes('best seller') ||
    lowerMsg.includes('best selling')
  ) {
    const countMatch = lowerMsg.match(/top\s*(\d+)|(\d+)\s*(?:પ્રોડક્ટ|products)/i);
    const count = countMatch ? parseInt(countMatch[1] || countMatch[2], 10) : 3;
    const selected = topProducts.slice(0, count);

    if (selected.length === 0) {
      return `No sales records found in the database yet. Top-performing items will appear here as soon as transactions are logged.`;
    }

    let reply = `🏆 **Top ${selected.length} Best-Selling Products:**\n\n`;
    selected.forEach((p, idx) => {
      reply += `${idx + 1}. **${p._id}**\n   • Total Units Sold: **${p.totalSold} units**\n   • Total Revenue: **₹${p.totalRevenue.toLocaleString('en-IN')}**\n\n`;
    });
    reply += `💡 **Recommendation:** Maintain a safety buffer of at least 2 weeks of inventory for these high-velocity products to avoid stockouts.`;
    return reply.trim();
  }

  // Query Type 4: Low Stock / Out of Stock queries
  if (
    lowerMsg.includes('ઓછો') ||
    lowerMsg.includes('ocho') ||
    lowerMsg.includes('o6o') ||
    lowerMsg.includes('low stock') ||
    lowerMsg.includes('stock <') ||
    lowerMsg.includes('less than') ||
    lowerMsg.includes('out of stock') ||
    lowerMsg.includes('ખૂટી') ||
    (lowerMsg.includes('stock') && (lowerMsg.includes('less') || lowerMsg.includes('under') || lowerMsg.includes('low') || lowerMsg.includes('10') || lowerMsg.includes('5') || lowerMsg.includes('20') || lowerMsg.includes('check'))) ||
    (lowerMsg.includes('સ્ટોક') && (lowerMsg.includes('ઓછો') || lowerMsg.includes('કેટલો') || lowerMsg.includes('10') || lowerMsg.includes('5') || lowerMsg.includes('20')))
  ) {
    if (lowStockProducts.length === 0) {
      return `✅ **Great news!** No products currently have stock below **${threshold} units**. All your active inventory levels are healthy.`;
    }

    let reply = `⚠️ **Low Stock Alert — Products with Stock < ${threshold} (${lowStockProducts.length} items found):**\n\n`;
    lowStockProducts.slice(0, 8).forEach((p, idx) => {
      const brandName = (p.brand as any)?.name ? ` [${(p.brand as any).name}]` : '';
      reply += `${idx + 1}. **${p.name}**${brandName}\n   • Current Stock: **${p.stock} units** (Critical!)\n   • Unit Price: **₹${p.price.toLocaleString('en-IN')}**\n   • SKU: \`${p.skuId}\`\n\n`;
    });

    if (lowStockProducts.length > 8) {
      reply += `_...and ${lowStockProducts.length - 8} more products have low stock._\n\n`;
    }

    reply += `💡 **Recommendation:** Generate Purchase Orders immediately for these low-stock items from their registered sellers to ensure uninterrupted fulfillment.`;
    return reply;
  }

  // Query Type 5: Brand Specific Sales / Stock
  const matchedBrand = brands.find(b => lowerMsg.includes(b.name.toLowerCase()));
  if (matchedBrand || lowerMsg.includes('apple') || lowerMsg.includes('samsung') || lowerMsg.includes('dell') || lowerMsg.includes('hp') || lowerMsg.includes('logitech')) {
    const brandName = matchedBrand ? matchedBrand.name : (lowerMsg.includes('apple') ? 'Apple' : lowerMsg.includes('samsung') ? 'Samsung' : lowerMsg.includes('dell') ? 'Dell' : lowerMsg.includes('hp') ? 'HP' : 'Logitech');
    const brandProducts = products.filter(p => {
      const bName = (p.brand as any)?.name || '';
      return bName.toLowerCase() === brandName.toLowerCase() || p.name.toLowerCase().includes(brandName.toLowerCase());
    });

    const brandStock = brandProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
    const brandValuation = brandProducts.reduce((acc, p) => acc + (p.stock || 0) * (p.price || 0), 0);

    let reply = `🍎 **${brandName} Brand Analytics:**\n\n`;
    reply += `• Total Product Models: **${brandProducts.length}**\n`;
    reply += `• Total Available Stock: **${brandStock} units**\n`;
    reply += `• Total Inventory Value: **₹${brandValuation.toLocaleString('en-IN')}**\n\n`;

    if (brandProducts.length > 0) {
      reply += `**Product Inventory Details:**\n`;
      brandProducts.slice(0, 5).forEach(p => {
        reply += `• **${p.name}**: Stock **${p.stock} units**, Price **₹${p.price.toLocaleString('en-IN')}**\n`;
      });
      reply += `\n💡 **Recommendation:** ${brandStock < 10 ? 'Inventory for this brand is running critically low. Issue a supplier reorder promptly.' : 'Current inventory levels for this brand are healthy and well-balanced.'}`;
    } else {
      reply += `No products found under this brand in your current inventory catalog.\n\n💡 **Recommendation:** Add products under this brand from the 'Create Product' section to start tracking.`;
    }
    return reply;
  }

  // Query Type 6: Total Revenue, Purchases, Profit & Valuation
  if (
    lowerMsg.includes('revenue') ||
    lowerMsg.includes('રેવેન્યુ') ||
    lowerMsg.includes('કમાણી') ||
    lowerMsg.includes('આવક') ||
    lowerMsg.includes('વેચાણ') ||
    lowerMsg.includes('sales') ||
    lowerMsg.includes('value') ||
    lowerMsg.includes('profit') ||
    lowerMsg.includes('નફો') ||
    lowerMsg.includes('કિંમત')
  ) {
    let reply = `💰 **Financial & Inventory Overview:**\n\n`;
    reply += `• **Total Sales Revenue:** ₹${totalRevenue.toLocaleString('en-IN')}\n`;
    reply += `• **Total Units Sold:** ${totalSalesUnits} units (${topProducts.length} unique products)\n`;
    reply += `• **Total Procurement Cost:** ₹${totalPurchaseCost.toLocaleString('en-IN')}\n`;
    reply += `• **Total Warehouse Inventory Valuation:** ₹${totalInventoryValue.toLocaleString('en-IN')}\n`;
    reply += `• **Active Product Variety:** ${totalProductsCount} items\n`;
    reply += `• **Total Warehouse Units:** ${products.reduce((acc, p) => acc + (p.stock || 0), 0)} units\n\n`;
    reply += `📊 Average Order Value: **₹${totalSalesUnits > 0 ? Math.round(totalRevenue / totalSalesUnits).toLocaleString('en-IN') : 0}** per unit.\n\n`;
    reply += `💡 **Recommendation:** Maintain healthy profit margins by focusing on fast-moving, high-margin accessories and electronics.`;
    return reply;
  }

  // Default Guidance
  return `Hello! I am your **Inventra AI Copilot**. 🤖✨\n\nI have complete 360-degree knowledge of your inventory, sales, customers, suppliers, and finances. Try asking me:\n\n• *"How much did Rahul Dave spend?"*\n• *"Who are our top 3 spending customers?"*\n• *"Which products are low in stock (< 10)?"*\n• *"Show analytics for Dell products"*\n• *"What is the total revenue and inventory value?"*\n• *"How much did we purchase from our suppliers?"*`;
}

