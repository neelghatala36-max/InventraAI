import { Router } from 'express';
import { AnalyticsController } from './analytics.controllers';
import verifyAuth from '../../middlewares/verifyAuth';

const router = Router();

router.get('/dashboard', AnalyticsController.getDashboardAnalytics);
router.get('/demand-forecast', verifyAuth, AnalyticsController.getComprehensiveDemandForecast);
router.get('/demand-forecast/:productId/deep-dive', verifyAuth, AnalyticsController.getAiForecastDeepDive);
router.get('/prediction/:skuId', AnalyticsController.getDemandPrediction);
router.get('/restock-recommendations', AnalyticsController.getRestockRecommendation);
router.get('/business-insights', AnalyticsController.getBusinessInsights);

export default router;
