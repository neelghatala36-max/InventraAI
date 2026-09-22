import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.services';
import httpStatus from 'http-status';

const getDashboardAnalytics = async (req: Request, res: Response) => {
  const salesTrends = await AnalyticsService.getSalesTrends();
  const topProducts = await AnalyticsService.getTopProducts();
  const inventoryStatus = await AnalyticsService.getInventoryInsights();

  res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'Analytics data fetched successfully',
    data: {
      salesTrends,
      topProducts,
      inventoryStatus,
    },
  });
};

const getDemandPrediction = async (req: Request, res: Response) => {
  const { skuId } = req.params;
  const prediction = await AnalyticsService.getDemandPrediction(skuId);

  res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'Demand prediction fetched successfully',
    data: prediction,
  });
};

const getRestockRecommendation = async (req: Request, res: Response) => {
  const recommendations = await AnalyticsService.getRestockRecommendation();

  res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'Restock recommendations fetched successfully',
    data: recommendations,
  });
};

const getBusinessInsights = async (req: Request, res: Response) => {
  const insights = await AnalyticsService.getBusinessInsights();

  res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business insights fetched successfully',
    data: insights,
  });
};

const getComprehensiveDemandForecast = async (req: Request, res: Response) => {
  const userId = (req as any).user?._id;
  const result = await AnalyticsService.getComprehensiveDemandForecast(userId);

  res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'Comprehensive demand forecast generated successfully',
    data: result,
  });
};

const getAiForecastDeepDive = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const userId = (req as any).user?._id;
  const result = await AnalyticsService.getAiForecastDeepDive(productId, userId);

  res.status(httpStatus.OK).json({
    statusCode: httpStatus.OK,
    success: true,
    message: 'AI Forecast Deep Dive generated successfully',
    data: result,
  });
};

export const AnalyticsController = {
  getDashboardAnalytics,
  getDemandPrediction,
  getRestockRecommendation,
  getBusinessInsights,
  getComprehensiveDemandForecast,
  getAiForecastDeepDive
};
