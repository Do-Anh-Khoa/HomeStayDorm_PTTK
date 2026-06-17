import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import apiRoutes from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Homestay Dorm API is running' })
})

app.use('/api', apiRoutes)
app.use(errorHandler)

export default app
