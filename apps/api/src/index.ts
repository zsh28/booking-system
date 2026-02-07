import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import authRoutes from './routes/authRoutes'
import serviceRoutes from './routes/serviceRoutes'
import appointmentRoutes from './routes/appointmentRoutes'
import providerRoutes from './routes/providerRoutes'
import { getOpenApiDocument } from './openapi'

const app = express()
const port = Number(process.env.API_PORT) || 3000

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
