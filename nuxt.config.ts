export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },

  vite: {
    server: {
      hmr: {
        protocol: 'ws',
      },
    },
    build: {
      sourcemap: true,
    },
  },

  devServer: {
    port: 3012,
    host: 'localhost',
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],

  supabase: {
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: { lang: 'uk' },
      titleTemplate: '%s — АгроПростір',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bitter:wght@700;900&display=swap' },
      ],
    },
  },

  routeRules: {
    '/catalog': { redirect: { to: '/pesticides', statusCode: 301 } },
    '/catalog/**': { redirect: { to: '/pesticides/**', statusCode: 301 } },
  },

  runtimeConfig: {
    public: {
      agroApiKey: process.env.NUXT_PUBLIC_AGRO_API_KEY,
      agroApiBase: process.env.NUXT_PUBLIC_AGRO_API_BASE || '',
      novaPostKey: process.env.NUXT_PUBLIC_NOVA_POST_KEY,
    },
  },
})
