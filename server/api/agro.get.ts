import { serverSupabaseClient } from '#supabase/server'

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const path = query.path as string
  if (!path) throw createError({ statusCode: 400, message: 'path required' })

  const supabase = await serverSupabaseClient(event)

  // Products list
  if (path === '/v1/products') {
    const limit = Number(query.limit) || 20
    const page = Number(query.page) || 1
    const from = (page - 1) * limit
    const includeTypes = query.include_types ? String(query.include_types).split(',') : null
    const excludeTypes = query.exclude_types ? String(query.exclude_types).split(',') : null

    let q = supabase.from('agro_products')
      .select('*, agro_manufacturers(name, slug)', { count: 'exact' })

    if (query.q) q = q.ilike('name', `%${query.q}%`)
    if (query.type) q = q.eq('type', String(query.type))
    if (query.manufacturer) q = q.eq('manufacturer_slug', String(query.manufacturer))
    if (includeTypes) q = q.in('type', includeTypes)
    if (excludeTypes) q = q.not('type', 'in', `(${excludeTypes.join(',')})`)
    if (query.seed_crop) q = q.eq('seed_crop', String(query.seed_crop))

    const { data, count, error } = await q.range(from, from + limit - 1).order('name')
    if (error) throw createError({ statusCode: 500, message: error.message })

    const items = (data || []).map((p: any) => ({
      ...p, manufacturer: p.agro_manufacturers || null, agro_manufacturers: undefined,
    }))
    return { items, total: count || 0, meta: { total: count || 0 } }
  }

  // Product analogs
  const analogsMatch = path.match(/^\/v1\/products\/([^/]+)\/analogs$/)
  if (analogsMatch) {
    const slug = analogsMatch[1]
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
  }

  // Single product
  const productMatch = path.match(/^\/v1\/products\/([^/]+)$/)
  if (productMatch) {
    const slug = productMatch[1]
    const { data, error } = await supabase.from('agro_products')
      .select(`*, agro_manufacturers(id, name, slug, website_url, country),
        agro_product_details(description, source_url, content_sections),
        agro_product_ingredients(concentration, agro_active_ingredients(id, name, slug))`)
      .eq('slug', slug).single()
    if (error) throw createError({ statusCode: 404, message: 'Not found' })

    const p = data as any
    return {
      product: {
        ...p,
        manufacturer: p.agro_manufacturers || null,
        description: p.agro_product_details?.description || null,
        source_url: p.agro_product_details?.source_url || null,
        content_sections: p.agro_product_details?.content_sections || null,
        active_ingredients: (p.agro_product_ingredients || []).map((pi: any) => ({
          ...pi.agro_active_ingredients, concentration: pi.concentration,
        })),
        agro_manufacturers: undefined, agro_product_details: undefined, agro_product_ingredients: undefined,
      },
    }
  }

  // Active ingredients list
  if (path === '/v1/active-ingredients') {
    const limit = Number(query.limit) || 50
    const offset = Number(query.offset) || 0

    let q = supabase.from('agro_active_ingredients').select('*', { count: 'exact' })
    if (query.q) q = q.ilike('name', `%${query.q}%`)
    if (query.letter) q = q.ilike('name', `${query.letter}%`)

    const { data, count, error } = await q.range(offset, offset + limit - 1).order('name')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return { items: data || [], total: count || 0 }
  }

  // Single ingredient
  const ingredientMatch = path.match(/^\/v1\/active-ingredients\/([^/]+)$/)
  if (ingredientMatch) {
    const slug = ingredientMatch[1]
    const { data: ingredient, error } = await supabase.from('agro_active_ingredients')
      .select('*').eq('slug', slug).single()
    if (error) throw createError({ statusCode: 404, message: 'Not found' })

    const { data: links } = await supabase.from('agro_product_ingredients')
      .select('product_id, concentration').eq('ingredient_id', (ingredient as any).id)
    const ids = (links || []).map((l: any) => l.product_id)
    let products: any[] = []
    if (ids.length) {
      const { data: prods } = await supabase.from('agro_products')
        .select('*, agro_manufacturers(name, slug)').in('id', ids).order('name')
      const concMap = new Map((links || []).map((l: any) => [l.product_id, l.concentration]))
      products = (prods || []).map((p: any) => ({
        ...p, manufacturer: p.agro_manufacturers || null, agro_manufacturers: undefined,
        active_ingredients: [{ ...(ingredient as any), concentration: concMap.get(p.id) }],
      }))
    }
    return { ingredient, products }
  }

  // Manufacturers
  if (path === '/v1/manufacturers') {
    const { data, error } = await supabase.from('agro_manufacturers')
      .select('*').eq('is_active', true).order('name')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return { items: data || [] }
  }

  // Weeds list
  if (path === '/v1/weeds') {
    const limit = Number(query.limit) || 50
    const offset = Number(query.offset) || 0

    let q = supabase.from('agro_weeds').select('*', { count: 'exact' })
    if (query.q) q = q.ilike('name', `%${query.q}%`)
    if (query.category) q = q.eq('category_slug', String(query.category))
    if (query.bio_class) q = q.eq('class_slug', String(query.bio_class))

    const { data, count, error } = await q.range(offset, offset + limit - 1).order('name')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return { items: data || [], total: count || 0 }
  }

  // Single weed
  const weedMatch = path.match(/^\/v1\/weeds\/([^/]+)$/)
  if (weedMatch) {
    const { data, error } = await supabase.from('agro_weeds').select('*').eq('slug', weedMatch[1]).single()
    if (error) throw createError({ statusCode: 404, message: 'Not found' })
    return { weed: data }
  }

  // Diseases list
  if (path === '/v1/diseases') {
    const limit = Number(query.limit) || 50
    const offset = Number(query.offset) || 0

    let q = supabase.from('agro_diseases').select('*', { count: 'exact' })
    if (query.q) q = q.ilike('name', `%${query.q}%`)
    if (query.category) q = q.eq('category_slug', String(query.category))
    if (query.culture) q = q.eq('culture', String(query.culture))

    const { data, count, error } = await q.range(offset, offset + limit - 1).order('name')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return { items: data || [], total: count || 0 }
  }

  // Single disease
  const diseaseMatch = path.match(/^\/v1\/diseases\/([^/]+)$/)
  if (diseaseMatch) {
    const { data, error } = await supabase.from('agro_diseases').select('*').eq('slug', diseaseMatch[1]).single()
    if (error) throw createError({ statusCode: 404, message: 'Not found' })
    return { disease: data }
  }

  // Fertilizers categories (static)
  if (path === '/v1/fertilizers/categories') {
    return { items: [
      { id: '2bbc07d1-85da-4cca-8b76-c0c7fe9f8691', name: 'Азотні', slug: 'azotni' },
      { id: '95413199-ee55-4881-be6f-739712b8a506', name: 'Калійні', slug: 'kaliyni' },
      { id: 'c848b34b-e510-452c-bc72-33e0ea121d69', name: 'Комплексні', slug: 'kompleksni' },
      { id: 'cbc638e3-7833-4a63-8f5a-9cf133f268ec', name: 'Мікродобрива', slug: 'mikrodobriva' },
      { id: '3e8a895a-049b-4c15-82f5-cb66095b870f', name: 'Фосфорні', slug: 'fosforni' },
    ] }
  }

  // Fertilizers list
  if (path === '/v1/fertilizers') {
    const limit = Number(query.limit) || 50
    const offset = Number(query.offset) || 0

    let q = supabase.from('agro_fertilizers').select('*', { count: 'exact' })
    if (query.q) q = q.ilike('name', `%${query.q}%`)
    if (query.category) q = q.eq('category_slug', String(query.category))

    const { data, count, error } = await q.range(offset, offset + limit - 1).order('name')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return { items: data || [], total: count || 0 }
  }

  // Single fertilizer
  const fertilizerMatch = path.match(/^\/v1\/fertilizers\/([^/]+)$/)
  if (fertilizerMatch) {
    const { data, error } = await supabase.from('agro_fertilizers').select('*').eq('slug', fertilizerMatch[1]).single()
    if (error) throw createError({ statusCode: 404, message: 'Not found' })
    return { fertilizer: data }
  }

  throw createError({ statusCode: 404, message: `Unknown path: ${path}` })
}, {
  maxAge: 60 * 60,
  name: 'agro',
  getKey: (event) => JSON.stringify(getQuery(event)),
})
