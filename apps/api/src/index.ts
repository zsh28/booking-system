import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import fs from 'node:fs'
import path from 'node:path'
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
const webDist = path.join(rootDir, 'apps/web/dist/client')
const apiPrefixes = [
  '/auth',
  '/services',
  '/appointments',
  '/providers',
  '/docs',
  '/openapi.json',
  '/health'
]

if (process.env.NODE_ENV === 'production' && fs.existsSync(webDist)) {
  app.use(express.static(webDist))
  app.get('*', (req, res, next) => {
    if (apiPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      return next()
    }

    res.sendFile(path.join(webDist, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
