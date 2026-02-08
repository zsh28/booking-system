import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pathToFileURL } from 'node:url'
import authRoutes from './routes/authRoutes'
import serviceRoutes from './routes/serviceRoutes'
import appointmentRoutes from './routes/appointmentRoutes'
import providerRoutes from './routes/providerRoutes'
import { getOpenApiDocument } from './openapi'

const app = express()
const port = Number(process.env.PORT || process.env.API_PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/openapi.json', (_req, res) => {
  res.json(getOpenApiDocument())
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(getOpenApiDocument()))

app.use('/auth', authRoutes)
app.use('/services', serviceRoutes)
app.use('/appointments', appointmentRoutes)
app.use('/providers', providerRoutes)

const rootDir = path.resolve(__dirname, '..', '..', '..')
const webClientDist = path.join(rootDir, 'apps/web/dist/client')
const webServerEntry = path.join(rootDir, 'apps/web/dist/server/server.js')
const apiPrefixes = [
  '/auth',
  '/services',
  '/appointments',
  '/providers',
  '/docs',
  '/openapi.json',
  '/health'
]

let startFetch: ((request: Request) => Promise<Response>) | null = null

const getStartFetch = async () => {
  if (!startFetch) {
    const module = await import(pathToFileURL(webServerEntry).href)
    const server = module.default || module.server || module
    startFetch = server.fetch
  }

  return startFetch
}

if (process.env.NODE_ENV === 'production') {
  if (fs.existsSync(webClientDist)) {
    app.use(express.static(webClientDist))
  }

  if (fs.existsSync(webServerEntry)) {
    app.use(async (req, res, next) => {
      if (apiPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
        return next()
      }

      try {
        const fetchHandler = await getStartFetch()
        if (!fetchHandler) {
          return next(new Error('TanStack Start server entry missing fetch handler'))
        }
        const requestUrl = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`)
        const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
        const requestInit = {
          method: req.method,
          headers: req.headers as Record<string, string | string[] | undefined>,
          body: hasBody ? req : undefined,
        } as RequestInit & { duplex?: 'half' }

        if (hasBody) {
          requestInit.duplex = 'half'
        }

        const response = await fetchHandler(new Request(requestUrl, requestInit))

        res.status(response.status)
        response.headers.forEach((value, key) => {
          res.setHeader(key, value)
        })

        if (response.body) {
          Readable.fromWeb(response.body as unknown as ReadableStream).pipe(res)
        } else {
          res.end()
        }
      } catch (error) {
        next(error)
      }
    })
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
