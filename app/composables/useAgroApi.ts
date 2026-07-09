export const useAgroApi = () => {
  const config = useRuntimeConfig()
  const key = config.public.agroApiKey as string
  const API_BASE = config.public.agroApiBase || 'http://127.0.0.1:4000'

  const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }

  return {
    getProducts: (params?: { search?: string; type?: string; ingredient?: string; manufacturer?: string; page?: number; limit?: number; excludeTypes?: string[]; includeTypes?: string[]; seedCrop?: string }) => {
      const query = new URLSearchParams()
      if (params?.search) query.append('q', params.search)
      if (params?.type) query.append('type', params.type)
      if (params?.ingredient) query.append('ingredient', params.ingredient)
      if (params?.manufacturer) query.append('manufacturer', params.manufacturer)
      if (params?.page) query.append('page', String(params.page))
      if (params?.excludeTypes?.length) query.append('exclude_types', params.excludeTypes.join(','))
      if (params?.includeTypes?.length) query.append('include_types', params.includeTypes.join(','))
      if (params?.seedCrop) query.append('seed_crop', params.seedCrop)
      query.append('limit', String(params?.limit || 20))
      return $fetch<any>(`${API_BASE}/v1/products?${query}`, { headers })
    },
    getProduct: (slug: string) => $fetch<any>(`${API_BASE}/v1/products/${slug}`, { headers }),
    getAnalogs: (slug: string) => $fetch<any>(`${API_BASE}/v1/products/${slug}/analogs`, { headers }),
    getProductTypes: () => $fetch<any>(`${API_BASE}/v1/product-types`, { headers }),
    getActiveIngredients: (params?: { q?: string; limit?: number; offset?: number; letter?: string }) => {
      const qs = new URLSearchParams()
      if (params?.q) qs.set('q', params.q)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      if (params?.letter) qs.set('letter', params.letter)
      return $fetch<any>(`${API_BASE}/v1/active-ingredients?${qs}`, { headers })
    },
    searchActiveIngredients: (q: string) => $fetch<any>(`${API_BASE}/v1/active-ingredients/search?q=${encodeURIComponent(q)}`, { headers }),
    getActiveIngredient: (slug: string) => $fetch<any>(`${API_BASE}/v1/active-ingredients/${slug}`, { headers }),
    getManufacturers: () => $fetch<any>(`${API_BASE}/v1/manufacturers`, { headers }),
    getFertilizers: (params?: { q?: string; category?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams()
      if (params?.q) qs.set('q', params.q)
      if (params?.category) qs.set('category', params.category)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      return $fetch<any>(`${API_BASE}/v1/fertilizers?${qs}`, { headers })
    },
    getFertilizerCategories: () => $fetch<any>(`${API_BASE}/v1/fertilizers/categories`, { headers }),
    getFertilizer: (slug: string) => $fetch<any>(`${API_BASE}/v1/fertilizers/${slug}`, { headers }),
  }
}
