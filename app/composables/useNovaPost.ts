const NP_API = 'https://api.novaposhta.ua/v2.0/json/'

export const useNovaPost = () => {
  const config = useRuntimeConfig()
  const NP_KEY = config.public.novaPostKey as string

  return {
  getAreas: async () => {
    const res = await $fetch<any>(NP_API, {
      method: 'POST',
      body: { apiKey: NP_KEY, modelName: 'Address', calledMethod: 'getAreas', methodProperties: {} },
    })
    return res.data || []
  },
  searchSettlements: async (query: string, areaRef = '') => {
    const res = await $fetch<any>(NP_API, {
      method: 'POST',
      body: { apiKey: NP_KEY, modelName: 'Address', calledMethod: 'searchSettlements', methodProperties: { CityName: query, Limit: 15, Page: 1, RegionRef: areaRef || undefined } },
    })
    return res.data?.[0]?.Addresses || []
  },
  getCitiesByArea: async (areaRef: string) => {
    const res = await $fetch<any>(NP_API, {
      method: 'POST',
      body: { apiKey: NP_KEY, modelName: 'Address', calledMethod: 'getCities', methodProperties: { AreaRef: areaRef, Limit: 500, Page: 1 } },
    })
    return res.data || []
  },
  searchCities: async (query: string) => {
    const res = await $fetch<any>(NP_API, {
      method: 'POST',
      body: { apiKey: NP_KEY, modelName: 'Address', calledMethod: 'searchSettlements', methodProperties: { CityName: query, Limit: 10, Page: 1 } },
    })
    return res.data?.[0]?.Addresses || []
  },
  getWarehouses: async (cityRef: string, query = '') => {
    const res = await $fetch<any>(NP_API, {
      method: 'POST',
      body: { apiKey: NP_KEY, modelName: 'AddressGeneral', calledMethod: 'getWarehouses', methodProperties: { CityRef: cityRef, FindByString: query, Limit: 50, Page: 1 } },
    })
    return res.data || []
  },
  }
}
