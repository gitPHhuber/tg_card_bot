import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Connect } from 'vite'
import type { ServerResponse } from 'http'

const RATE = 102.5

const PRODUCTS = [
  { id: 1, slug: 'visa-20',  name: 'Visa $20',  description: 'Виртуальная карта на $20. Подходит для ChatGPT Plus, Spotify.', face_value_usd: 20,  price_rub: Math.round(20  * RATE * 1.07), rate: RATE },
  { id: 2, slug: 'visa-50',  name: 'Visa $50',  description: 'Виртуальная карта на $50. Claude Pro, подписки, мелкие покупки.',   face_value_usd: 50,  price_rub: Math.round(50  * RATE * 1.07), rate: RATE },
  { id: 3, slug: 'visa-100', name: 'Visa $100', description: 'Виртуальная карта на $100. Универсальный номинал.',                  face_value_usd: 100, price_rub: Math.round(100 * RATE * 1.07), rate: RATE },
  { id: 4, slug: 'visa-200', name: 'Visa $200', description: 'Виртуальная карта на $200. Для крупных покупок.',                    face_value_usd: 200, price_rub: Math.round(200 * RATE * 1.07), rate: RATE },
]

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const mockApi: Connect.NextHandleFunction = (req, res, next) => {
  const url = req.url ?? ''
  if (!url.startsWith('/api/')) return next()

  if (url === '/api/products') return send(res, 200, { products: PRODUCTS, rate: RATE })
  if (url === '/api/rate')     return send(res, 200, { rate_usd_rub: RATE })
  if (url === '/api/orders' && req.method === 'GET') return send(res, 200, { orders: [] })

  const productMatch = url.match(/^\/api\/products\/([^/?]+)/)
  if (productMatch) {
    const p = PRODUCTS.find(x => x.slug === productMatch[1])
    return p ? send(res, 200, p) : send(res, 404, { detail: 'not found' })
  }

  if (url === '/api/orders' && req.method === 'POST') {
    return send(res, 200, { order_id: 1, payment_url: 'https://yookassa.ru/checkout/mock', amount_rub: 2200 })
  }

  return send(res, 404, { detail: 'mock: not implemented' })
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use(mockApi)
      },
    },
  ],
})
