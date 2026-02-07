import express from 'express'
import cors from 'cors'
import authRoutes from './routes/authRoutes'
import serviceRoutes from './routes/serviceRoutes'
import appointmentRoutes from './routes/appointmentRoutes'
import providerRoutes from './routes/providerRoutes'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/services', serviceRoutes)
app.use('/appointments', appointmentRoutes)
app.use('/providers', providerRoutes)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
