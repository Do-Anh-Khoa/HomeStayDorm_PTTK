import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import apiRoutes from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.js'

dotenv.config()

const app = express()

// ---- Middleware ----
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// ---- Routes ----
app.use('/api', apiRoutes)

// ---- Health check ----
app.get('/', (req, res) => {
  res.json({ message: 'Homestay Dorm API đang chạy' })
})

app.use(errorHandler)

export default app
