// Content-Security-Policy (лише продакшн — у dev заважала б Vite HMR).
// 'unsafe-inline' для скриптів потрібен вбудованим скриптам Nuxt і Clarity; nonce-CSP — окрема задача (nuxt-security).
const supabaseOrigin = (() => {
  try { return new URL(process.env.SUPABASE_URL || '').origin } catch { return 'https://*.supabase.co' }
})()
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.clarity.ms https://*.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace('https://', 'wss://')} https://api.novaposhta.ua https://api.open-meteo.com https://*.clarity.ms https://c.bing.com`,
  "frame-src 'none'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://secure.wayforpay.com",
  'upgrade-insecure-requests',
].join('; ')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
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
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
      ],
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

    // SPA-режим для захищених / клієнтських сторінок
    '/dashboard/**':    { ssr: false },
    '/admin/**':        { ssr: false },
    '/auth':            { ssr: false },
    '/role-select':     { ssr: false },
    '/invite':          { ssr: false },
    '/payment/**':      { ssr: false },
    '/cart':            { ssr: false },
    '/checkout':        { ssr: false },
    '/harvest-worker':  { ssr: false },

    '/**': {
      headers: {
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        ...(process.env.NODE_ENV === 'production' ? { 'Content-Security-Policy': CSP } : {}),
      },
    },
  },

  runtimeConfig: {
    public: {
      novaPostKey: process.env.NUXT_PUBLIC_NOVA_POST_KEY,
    },
  },
})
