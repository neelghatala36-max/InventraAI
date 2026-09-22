import { baseApi } from '../baseApi';

const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnalytics: builder.query({
      query: () => ({
        url: '/analytics/dashboard',
        method: 'GET',
      }),
      providesTags: ['analytics'],
    }),
    getDemandPrediction: builder.query({
      query: (skuId) => ({
        url: `/analytics/prediction/${skuId}`,
        method: 'GET',
      }),
    }),
    getRestockRecommendations: builder.query({
      query: () => ({
        url: '/analytics/restock-recommendations',
        method: 'GET',
      }),
    }),
    getBusinessInsights: builder.query({
      query: () => ({
        url: '/analytics/business-insights',
        method: 'GET',
      }),
    }),
    getDemandForecast: builder.query({
      query: () => ({
        url: '/analytics/demand-forecast',
        method: 'GET',
      }),
      providesTags: ['analytics', 'product'],
    }),
    getAiForecastDeepDive: builder.query({
      query: (productId) => ({
        url: `/analytics/demand-forecast/${productId}/deep-dive`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetDashboardAnalyticsQuery,
  useLazyGetDemandPredictionQuery,
  useGetRestockRecommendationsQuery,
  useGetBusinessInsightsQuery,
  useGetDemandForecastQuery,
  useLazyGetAiForecastDeepDiveQuery
} = analyticsApi;
