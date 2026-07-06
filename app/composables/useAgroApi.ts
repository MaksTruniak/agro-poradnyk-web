export const useAgroApi = () => {
  const config = useRuntimeConfig()
  const key = config.public.agroApiKey as string
  const API_BASE = config.public.agroApiBase || 'http://127.0.0.1:4000'

  const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }

  return {
    getProducts: (params?: { search?: string; type?: string; ingredient?: string; manufacturer?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams()
      if (params?.search) query.append('q', params.search)
      if (params?.type) query.append('type', params.type)
      if (params?.ingredient) query.append('ingredient', params.ingredient)
      if (params?.manufacturer) query.append('manufacturer', params.manufacturer)
      if (params?.page) query.append('page', String(params.page))
      query.append('limit', String(params?.limit || 20))
      return $fetch<any>(`${API_BASE}/v1/products?${query}`, { headers })
    },
    getProduct: (slug: string) => $fetch<any>(`${API_BASE}/v1/products/${slug}`, { headers }),
    getAnalogs: (slug: string) => $fetch<any>(`${API_BASE}/v1/products/${slug}/analogs`, { headers }),
    getProductTypes: () => $fetch<any>(`${API_BASE}/v1/product-types`, { headers }),
    searchActiveIngredients: (q: string) => $fetch<any>(`${API_BASE}/v1/active-ingredients/search?q=${encodeURIComponent(q)}`, { headers }),
    getActiveIngredient: (slug: string) => $fetch<any>(`${API_BASE}/v1/active-ingredients/${slug}`, { headers }),
    getManufacturers: () => $fetch<any>(`${API_BASE}/v1/manufacturers`, { headers }),
  }
}
