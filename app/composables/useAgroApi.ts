export const useAgroApi = () => {
  const supabase = useSupabaseClient()

  return {
    getProducts: async (params?: {
      search?: string; type?: string; ingredient?: string; manufacturer?: string
      page?: number; limit?: number; excludeTypes?: string[]; includeTypes?: string[]; seedCrop?: string
    }) => {
      const limit = params?.limit || 20
      const page = params?.page || 1
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase.from('agro_products')
        .select('*, agro_manufacturers(name, slug)', { count: 'exact' })

      if (params?.search) query = query.ilike('name', `%${params.search}%`)
      if (params?.type) query = query.eq('type', params.type)
      if (params?.manufacturer) query = query.eq('manufacturer_slug', params.manufacturer)
      if (params?.includeTypes?.length) query = query.in('type', params.includeTypes)
      if (params?.excludeTypes?.length) query = query.not('type', 'in', `(${params.excludeTypes.join(',')})`)
      if (params?.seedCrop) query = query.eq('seed_crop', params.seedCrop)

      if (params?.ingredient) {
        const { data: ing } = await supabase.from('agro_active_ingredients')
          .select('id').eq('slug', params.ingredient).single()
        if (ing) {
          const { data: links } = await supabase.from('agro_product_ingredients')
            .select('product_id').eq('ingredient_id', (ing as any).id)
          const ids = (links || []).map((l: any) => l.product_id)
          if (!ids.length) return { items: [], total: 0 }
          query = query.in('id', ids)
        }
      }

      const { data, count, error } = await query.range(from, to).order('name')
      if (error) throw error

      const items = (data || []).map((p: any) => ({
        ...p,
        manufacturer: p.agro_manufacturers || null,
        agro_manufacturers: undefined,
      }))
      return { items, total: count || 0 } as any
    },

    getProduct: async (slug: string) => {
      const { data, error } = await supabase.from('agro_products')
        .select(`
          *,
          agro_manufacturers(id, name, slug, website_url, country),
          agro_product_details(description, source_url, content_sections),
          agro_product_ingredients(concentration, agro_active_ingredients(id, name, slug))
        `)
        .eq('slug', slug)
        .single()
      if (error) throw error

      const p = data as any
      return {
        product: {
          ...p,
          manufacturer: p.agro_manufacturers || null,
          description: p.agro_product_details?.description || null,
          source_url: p.agro_product_details?.source_url || null,
          content_sections: p.agro_product_details?.content_sections || null,
          active_ingredients: (p.agro_product_ingredients || []).map((pi: any) => ({
            ...pi.agro_active_ingredients,
            concentration: pi.concentration,
          })),
          agro_manufacturers: undefined,
          agro_product_details: undefined,
          agro_product_ingredients: undefined,
        },
      }
    },

    getAnalogs: async (slug: string) => {
      // Find product by slug, then get products with same active ingredients
      const { data: product } = await supabase.from('agro_products').select('id, type').eq('slug', slug).single()
      if (!product) return { analogs: [] }

      const { data: links } = await supabase.from('agro_product_ingredients')
        .select('ingredient_id').eq('product_id', (product as any).id)
      const ingredientIds = (links || []).map((l: any) => l.ingredient_id)
      if (!ingredientIds.length) return { analogs: [] }

      const { data: analogLinks } = await supabase.from('agro_product_ingredients')
        .select('product_id').in('ingredient_id', ingredientIds)
        .neq('product_id', (product as any).id)
      const analogIds = [...new Set((analogLinks || []).map((l: any) => l.product_id))].slice(0, 12)
      if (!analogIds.length) return { analogs: [] }

      const { data } = await supabase.from('agro_products')
        .select('*, agro_manufacturers(name, slug)')
        .in('id', analogIds).eq('type', (product as any).type).limit(6)
      const analogs = (data || []).map((p: any) => ({
        ...p, manufacturer: p.agro_manufacturers || null, agro_manufacturers: undefined,
      }))
      return { analogs }
    },

    getProductTypes: () => Promise.resolve([
      { slug: 'herbicide', name: 'Гербіциди' },
      { slug: 'fungicide', name: 'Фунгіциди' },
      { slug: 'insecticide', name: 'Інсектициди' },
      { slug: 'seed_treatment', name: 'Протруйники' },
      { slug: 'growth_regulator', name: 'Регулятори росту' },
      { slug: 'rodenticide', name: 'Родентициди' },
    ]),

    getActiveIngredients: async (params?: { q?: string; limit?: number; offset?: number; letter?: string }) => {
      const limit = params?.limit || 50
      const offset = params?.offset || 0

      let query = supabase.from('agro_active_ingredients')
        .select('*', { count: 'exact' })

      if (params?.q) query = query.ilike('name', `%${params.q}%`)
      if (params?.letter) query = query.ilike('name', `${params.letter}%`)

      const { data, count, error } = await query.range(offset, offset + limit - 1).order('name')
      if (error) throw error
      return { items: data || [], total: count || 0 }
    },

    searchActiveIngredients: async (q: string) => {
      const { data, error } = await supabase.from('agro_active_ingredients')
        .select('*').ilike('name', `%${q}%`).limit(20).order('name')
      if (error) throw error
      return { items: data || [] }
    },

    getActiveIngredient: async (slug: string) => {
      const { data: ingredient, error } = await supabase.from('agro_active_ingredients')
        .select('*').eq('slug', slug).single()
      if (error) throw error

      const { data: links } = await supabase.from('agro_product_ingredients')
        .select('product_id, concentration').eq('ingredient_id', (ingredient as any).id)

      const productIds = (links || []).map((l: any) => l.product_id)
      let products: any[] = []
      if (productIds.length) {
        const { data: prods } = await supabase.from('agro_products')
          .select('*, agro_manufacturers(name, slug)').in('id', productIds).order('name')
        const concMap = new Map((links || []).map((l: any) => [l.product_id, l.concentration]))
        products = (prods || []).map((p: any) => ({
          ...p,
          manufacturer: p.agro_manufacturers || null,
          agro_manufacturers: undefined,
          active_ingredients: [{ id: (ingredient as any).id, name: (ingredient as any).name, slug: (ingredient as any).slug, concentration: concMap.get(p.id) }],
        }))
      }

      return { ingredient, products }
    },

    getManufacturers: async () => {
      const { data, error } = await supabase.from('agro_manufacturers')
        .select('*').eq('is_active', true).order('name')
      if (error) throw error
      return { items: data || [] }
    },

    getFertilizers: async (params?: { q?: string; category?: string; limit?: number; offset?: number }) => {
      const limit = params?.limit || 50
      const offset = params?.offset || 0

      let query = supabase.from('agro_fertilizers').select('*', { count: 'exact' })

      if (params?.q) query = query.ilike('name', `%${params.q}%`)
      if (params?.category) query = query.eq('category_slug', params.category)

      const { data, count, error } = await query.range(offset, offset + limit - 1).order('name')
      if (error) throw error
      return { items: data || [], total: count || 0 }
    },

    getFertilizerCategories: () => Promise.resolve([
      { id: '2bbc07d1-85da-4cca-8b76-c0c7fe9f8691', name: 'Азотні', slug: 'azotni' },
      { id: '95413199-ee55-4881-be6f-739712b8a506', name: 'Калійні', slug: 'kaliyni' },
      { id: 'c848b34b-e510-452c-bc72-33e0ea121d69', name: 'Комплексні', slug: 'kompleksni' },
      { id: 'cbc638e3-7833-4a63-8f5a-9cf133f268ec', name: 'Мікродобрива', slug: 'mikrodobriva' },
      { id: '3e8a895a-049b-4c15-82f5-cb66095b870f', name: 'Фосфорні', slug: 'fosforni' },
    ]),

    getFertilizer: async (slug: string) => {
      const { data, error } = await supabase.from('agro_fertilizers').select('*').eq('slug', slug).single()
      if (error) throw error
      return { fertilizer: data }
    },

    getWeeds: async (params?: { q?: string; category?: string; bio_class?: string; limit?: number; offset?: number }) => {
      const limit = params?.limit || 50
      const offset = params?.offset || 0

      let query = supabase.from('agro_weeds').select('*', { count: 'exact' })

      if (params?.q) query = query.ilike('name', `%${params.q}%`)
      if (params?.category) query = query.eq('category_slug', params.category)
      if (params?.bio_class) query = query.eq('class_slug', params.bio_class)

      const { data, count, error } = await query.range(offset, offset + limit - 1).order('name')
      if (error) throw error
      return { items: data || [], total: count || 0 }
    },

    getWeed: async (slug: string) => {
      const { data, error } = await supabase.from('agro_weeds').select('*').eq('slug', slug).single()
      if (error) throw error
      return { weed: data }
    },

    getDiseases: async (params?: { q?: string; category?: string; culture?: string; limit?: number; offset?: number }) => {
      const limit = params?.limit || 50
      const offset = params?.offset || 0

      let query = supabase.from('agro_diseases').select('*', { count: 'exact' })

      if (params?.q) query = query.ilike('name', `%${params.q}%`)
      if (params?.category) query = query.eq('category_slug', params.category)
      if (params?.culture) query = query.eq('culture', params.culture)

      const { data, count, error } = await query.range(offset, offset + limit - 1).order('name')
      if (error) throw error
      return { items: data || [], total: count || 0 }
    },

    getDisease: async (slug: string) => {
      const { data, error } = await supabase.from('agro_diseases').select('*').eq('slug', slug).single()
      if (error) throw error
      return { disease: data }
    },
  }
}
