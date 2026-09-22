import { baseApi } from "../baseApi";

const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (query) => ({
        url: '/products',
        method: 'GET',
        params: query
      }),
      providesTags: ['product']
    }),
    countProducts: builder.query({
      query: (query) => ({
        url: '/products/total',
        method: 'GET',
        params: query
      }),
      providesTags: ['product']
    }),
    getSingleProduct: builder.query({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'GET'
      }),
      providesTags: ['product']
    }),
    getProductBySku: builder.query({
      query: (sku_id) => ({
        url: `/products/search`,
        method: 'GET',
        params: { sku_id }
      }),
      providesTags: ['product']
    }),
    createNewProduct: builder.mutation({
      query: (payload) => ({
        url: '/products',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['product']
    }),
    addStock: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/${id}/add`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['product']
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['product']
    }),
    updateProduct: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: payload
      }),
      invalidatesTags: ['product']
    }),
    bulkDelete: builder.mutation({
      query: (payload) => ({
        url: '/products/bulk-delete',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['product']
    }),
  })
})

export const {
  useGetAllProductsQuery,
  useCountProductsQuery,
  useCreateNewProductMutation,
  useAddStockMutation,
  useDeleteProductMutation,
  useGetSingleProductQuery,
  useGetProductBySkuQuery,
  useUpdateProductMutation,
  useBulkDeleteMutation } = productApi