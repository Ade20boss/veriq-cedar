export type ApiResult<T> = Promise<T>

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

export const authApi = {
  baseUrl: apiBaseUrl,
  signIn: async () => ({ userId: "demo-ada-okafor", demo: true }),
}

export const transactionsApi = {
  list: async () => [],
  getById: async (_transactionId: string) => null,
}

export const complaintsApi = {
  list: async () => [],
  create: async <T>(input: T) => input,
}

export const transactionInsightsApi = {
  get: async (_transactionId: string) => null,
}

export const notificationsApi = {
  list: async () => [],
}
