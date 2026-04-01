/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth'
import workRecordsRouter from './routes/workRecords'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
const API_BASE_PATH = process.env.API_BASE_PATH || '/wr-api'
const apiBases = Array.from(new Set(['/api', API_BASE_PATH]))

for (const base of apiBases) {
  app.use(`${base}/auth`, authRoutes)
  app.use(`${base}/work-records`, workRecordsRouter)
}

/**
 * health
 */
for (const base of apiBases) {
  app.use(
    `${base}/health`,
    (req: Request, res: Response, next: NextFunction): void => {
      res.status(200).json({
        success: true,
        message: 'ok',
      })
    },
  )
}

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    details: error.message,
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
