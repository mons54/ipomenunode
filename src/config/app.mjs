import express from 'express'
import cors from 'cors'
import { APP_ALLOW_ORIGIN, APP_PORT } from './env.mjs'
import download from '../controllers/download.mjs'
import { HttpError } from '../services/httpError.mjs'

const app = express()

app.use(cors({
  origin: APP_ALLOW_ORIGIN
}))

app.use(express.json({
  limit: '50mb'
}))

app.use('/download', download)

app.use((err, req, res, next) => {

  let statusCode = 500
  let error = 'Internal Server Error'
  let code

  if (err instanceof HttpError) {
    statusCode = err.statusCode
    error = err.message
    code = err.code
  }

  res.status(statusCode).json({
    error,
    code,
  })

  console.error(err)
  
  next()
})

export default app
