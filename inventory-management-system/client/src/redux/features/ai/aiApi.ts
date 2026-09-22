import { baseApi } from '../baseApi';

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    askCopilot: builder.mutation({
      query: (data: { message: string; history?: Array<{ sender: 'user' | 'bot'; text: string }> }) => ({
        url: '/ai/copilot',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useAskCopilotMutation } = aiApi;
