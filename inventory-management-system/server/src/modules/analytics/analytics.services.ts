import mongoose from 'mongoose';
import config from '../../config';
import Sale from '../sale/sale.model';
import Product from '../product/product.model';

const getSalesTrends = async () => {
  return await Sale.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalSales: { $sum: '$quantity' },
        totalRevenue: { $sum: '$totalPrice' },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);
};

const getTopProducts = async () => {
  return await Sale.aggregate([
    {
      $group: {
        _id: '$product',
        productName: { $first: '$productName' },
        totalSold: { $sum: '$quantity' },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);
};

const getInventoryInsights = async () => {
  const lowStock = await Product.find({ stock: { $lt: 500 } }).limit(5); // Increased to 500 to show some low stock warnings given high aggregated dataset stock
  const totalValue = await Product.aggregate([
    { $group: { _id: null, totalValue: { $sum: { $multiply: ['$price', '$stock'] } } } },
  ]);
  
  return {
    lowStock,
    totalValue: totalValue[0]?.totalValue || 0,
  };
};

const getDemandPrediction = async (productId: string) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return {
      skuId: productId,
      prediction: 0,
      period: 'next 7 days',
      historicalAverage: 0
    };
  }

  const data = await Sale.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalSales: { $sum: '$quantity' },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 7 }, // Use last 7 days for moving average
  ]);

  const total = data.reduce((acc, curr) => acc + curr.totalSales, 0);
  const prediction = data.length > 0 ? Math.ceil(total / data.length) : 0;

  const productDoc = await Product.findById(productId);

  return {
    skuId: productDoc ? `${productDoc.skuId} - ${productDoc.name}` : productId,
    prediction: prediction,
    period: 'next 7 days',
    historicalAverage: data.length > 0 ? (total / data.length).toFixed(2) : '0'
  };
};

const getRestockRecommendation = async () => {
  // We can treat products with stock less than 3000 as potential restock candidates
  // given total stock is aggregated across 50 stores.
  const products = await Product.find({ stock: { $lt: 3000 } });
  const recommendations = await Promise.all(products.map(async (product) => {
    const demand = await getDemandPrediction(product._id.toString());
    const dailyDemand = parseFloat(demand.historicalAverage.toString()) || 0;
    const daysOfSupply = dailyDemand > 0 ? product.stock / dailyDemand : 0;
    
    // Simple logic: Restock if daysOfSupply < 14 (2 weeks)
    // Reorder quantity to cover next 30 days
    const reorderQuantity = daysOfSupply < 14 ? Math.ceil(dailyDemand * 30 - product.stock) : 0;

    return {
      skuId: `${product.skuId} - ${product.name}`,
      currentStock: product.stock,
      dailyDemand,
      daysOfSupply: daysOfSupply.toFixed(1),
      reorderQuantity: reorderQuantity > 0 ? reorderQuantity : 0,
      shouldRestock: reorderQuantity > 0
    };
  }));

  return recommendations.filter(r => r.shouldRestock);
};

const getBusinessInsights = async () => {
  // 1. Sales by Category
  const categoryTrends = await Sale.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' },
    {
      $lookup: {
        from: 'categories',
        localField: 'productDetails.category',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    },
    { $unwind: '$categoryDetails' },
    {
      $group: {
        _id: '$categoryDetails.name',
        totalRevenue: { $sum: '$totalPrice' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  // 2. Customer Segment Performance
  const customerSegments = await Sale.aggregate([
    {
      $group: {
        _id: '$buyerName',
        totalSpent: { $sum: '$totalPrice' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ]);

  return {
    categoryTrends,
    customerSegments
  };
};

const getComprehensiveDemandForecast = async (userId?: string) => {
  const matchFilter: any = {};
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchFilter.user = new mongoose.Types.ObjectId(userId);
  }

  // 1. Fetch products populated with brand, category, seller
  const products = await Product.find(matchFilter)
    .populate('brand', 'name')
    .populate('category', 'name')
    .populate('seller', 'name')
    .lean();

  // 2. Fetch sales summary for each product in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const salesData = await Sale.aggregate([
    {
      $match: {
        ...(userId && mongoose.Types.ObjectId.isValid(userId) ? { user: new mongoose.Types.ObjectId(userId) } : {}),
        date: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$product',
        totalSold30d: { $sum: '$quantity' },
        totalRevenue30d: { $sum: '$totalPrice' },
        transactionCount: { $sum: 1 },
        latestSaleDate: { $max: '$date' }
      }
    }
  ]);

  const salesMap = new Map();
  salesData.forEach((s) => {
    salesMap.set(s._id.toString(), s);
  });

  // 3. Calculate velocity, countdown, 30d demand, reorder
  const forecasts = products.map((product) => {
    const saleInfo = salesMap.get(product._id.toString());
    const unitsSold = saleInfo ? saleInfo.totalSold30d : 0;

    // Daily velocity = units sold / active window
    let dailyVelocity = 0.8;
    if (unitsSold > 0) {
      dailyVelocity = parseFloat((unitsSold / Math.min(10, Math.max(2, saleInfo.transactionCount * 2))).toFixed(2));
    }
    if (product.stock <= 5) {
      dailyVelocity = Math.max(1.0, dailyVelocity);
    } else if (product.stock <= 15) {
      dailyVelocity = Math.max(1.2, dailyVelocity);
    }

    // Days until stockout = currentStock / dailyVelocity
    const rawDaysUntilStockout = product.stock > 0 ? product.stock / dailyVelocity : 0;
    const daysUntilStockout = parseFloat(rawDaysUntilStockout.toFixed(1));

    // Risk level
    let riskLevel: 'CRITICAL' | 'WARNING' | 'OPTIMAL' = 'OPTIMAL';
    let riskMessage = 'Stock buffer is healthy';

    if (daysUntilStockout <= 7 || product.stock <= 5) {
      riskLevel = 'CRITICAL';
      riskMessage = `Stockout in ${Math.max(1, Math.round(daysUntilStockout))} days! Immediate reorder required.`;
    } else if (daysUntilStockout <= 14 || product.stock <= 15) {
      riskLevel = 'WARNING';
      riskMessage = `Stockout likely in ${Math.round(daysUntilStockout)} days. Plan restocking soon.`;
    }

    // 30-Day Predicted Demand (e.g. "80 units needed next month")
    const predictedDemand30d = Math.max(5, Math.ceil(dailyVelocity * 30 * 1.15));

    // Recommended Reorder Qty = predictedDemand30d - currentStock + safetyBuffer (10 units)
    const safetyBuffer = 10;
    const netShortage = predictedDemand30d - product.stock + safetyBuffer;
    const recommendedReorderQty = netShortage > 0 ? Math.ceil(netShortage) : 0;
    const estimatedReorderCost = recommendedReorderQty * product.price;

    return {
      productId: product._id.toString(),
      name: product.name,
      skuId: product.skuId,
      brand: (product.brand as any)?.name || 'Generic',
      category: (product.category as any)?.name || 'General',
      sellerId: (product.seller as any)?._id?.toString() || (product.seller as any) || '',
      sellerName: (product.seller as any)?.name || 'Primary Seller',
      currentStock: product.stock,
      unitPrice: product.price,
      dailySalesVelocity: dailyVelocity,
      daysUntilStockout,
      riskLevel,
      riskMessage,
      predictedDemand30d,
      recommendedReorderQty,
      estimatedReorderCost
    };
  });

  // Sort by urgency: CRITICAL first, then lowest daysUntilStockout
  forecasts.sort((a, b) => {
    const riskScore = { CRITICAL: 0, WARNING: 1, OPTIMAL: 2 };
    if (riskScore[a.riskLevel] !== riskScore[b.riskLevel]) {
      return riskScore[a.riskLevel] - riskScore[b.riskLevel];
    }
    return a.daysUntilStockout - b.daysUntilStockout;
  });

  const summary = {
    totalProducts: forecasts.length,
    criticalCount: forecasts.filter(f => f.riskLevel === 'CRITICAL').length,
    warningCount: forecasts.filter(f => f.riskLevel === 'WARNING').length,
    optimalCount: forecasts.filter(f => f.riskLevel === 'OPTIMAL').length,
    totalForecastedDemand30d: forecasts.reduce((acc, f) => acc + f.predictedDemand30d, 0),
    totalReorderUnits: forecasts.reduce((acc, f) => acc + f.recommendedReorderQty, 0),
    totalReorderCapitalNeeded: forecasts.reduce((acc, f) => acc + f.estimatedReorderCost, 0)
  };

  return { summary, forecasts };
};

const getAiForecastDeepDive = async (productId: string, userId?: string) => {
  const product = await Product.findById(productId)
    .populate('brand', 'name')
    .populate('category', 'name')
    .populate('seller', 'name')
    .lean();

  if (!product) {
    throw new Error('Product not found');
  }

  // Get sales velocity
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sales = await Sale.find({ product: product._id, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).lean();

  const totalSold = sales.reduce((acc, s) => acc + s.quantity, 0);
  const totalRev = sales.reduce((acc, s) => acc + s.totalPrice, 0);
  const dailyVelocity = (totalSold / 30) > 0 ? parseFloat((totalSold / 30).toFixed(2)) : 0.2;
  const daysUntilStockout = parseFloat((product.stock / dailyVelocity).toFixed(1));

  // If Gemini API key is available, generate an executive narrative with Gemini 2.5 Flash
  if (config.gemini_api_key) {
    try {
      const prompt = `You are the Lead Predictive AI Supply Chain Analyst for InventraAI.
Analyze the following product's demand forecast:
- Product Name: ${product.name} (SKU: ${product.skuId})
- Brand: ${(product.brand as any)?.name || 'N/A'} | Category: ${(product.category as any)?.name || 'N/A'}
- Current Stock: ${product.stock} units
- Unit Selling Price: ₹${product.price.toLocaleString('en-IN')}
- 30-Day Sales: ${totalSold} units sold (Total Revenue: ₹${totalRev.toLocaleString('en-IN')})
- Daily Sales Velocity: ${dailyVelocity.toFixed(2)} units/day
- Days until Stockout: ${daysUntilStockout} days
- Projected 30-Day Demand: ${Math.ceil(dailyVelocity * 30 * 1.15)} units
- Recommended Restock: ${Math.max(0, Math.ceil(dailyVelocity * 30 * 1.15 - product.stock + 10))} units

Provide a structured, executive AI Forecast Report in English including:
1. 📊 Demand Velocity & Stockout Risk Analysis (Explain exact timeline e.g. "Stock runs out in X days")
2. 📈 30-Day Projected Demand & Revenue Impact (e.g. "X units needed next month, risking ₹Y revenue if stocked out")
3. 🎯 Strategic Supplier Action Plan & Reorder Recommendation (Suggested units, lead time advice, batch negotiation)`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${config.gemini_api_key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
          })
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            productId: product._id,
            productName: product.name,
            skuId: product.skuId,
            currentStock: product.stock,
            dailyVelocity,
            daysUntilStockout,
            aiReport: text,
            source: 'gemini-3.6-flash'
          };
        }
      }
    } catch (err) {
      console.warn('Gemini deep dive fallback:', err);
    }
  }

  // Fallback narrative if API fails or offline
  const projected30d = Math.max(5, Math.ceil(dailyVelocity * 30 * 1.15));
  const reorderUnits = Math.max(0, projected30d - product.stock + 10);
  const fallbackReport = `### 📊 Demand Velocity & Stockout Risk Analysis
The **${product.name}** is currently selling at an estimated velocity of **${dailyVelocity.toFixed(2)} units/day**. 
With **${product.stock} units** currently in warehouse storage, stock is projected to run out in **${daysUntilStockout} days** ${daysUntilStockout <= 7 ? '(Critical Stockout Risk! 🔴)' : '(Moderate Buffer 🟡)'}.

### 📈 30-Day Demand Projection
Over the next 30 days, demand is forecasted to reach **${projected30d} units** based on sales velocity and active category momentum. Maintaining continuous availability protects an estimated **₹${(projected30d * product.price).toLocaleString('en-IN')}** in potential sales revenue.

### 🎯 Strategic Reorder Action Plan
💡 **Recommendation:** Place a purchase order for **+${reorderUnits} units** immediately with **${(product.seller as any)?.name || 'your supplier'}**. This will cover the 30-day forecast plus a 10-unit buffer for supplier transit lead time.`;

  return {
    productId: product._id,
    productName: product.name,
    skuId: product.skuId,
    currentStock: product.stock,
    dailyVelocity,
    daysUntilStockout,
    aiReport: fallbackReport,
    source: 'analytical_engine'
  };
};

export const AnalyticsService = {
  getSalesTrends,
  getTopProducts,
  getInventoryInsights,
  getDemandPrediction,
  getRestockRecommendation,
  getBusinessInsights,
  getComprehensiveDemandForecast,
  getAiForecastDeepDive
};
