import { config } from 'dotenv'
import { resolve } from 'path'

export const NODE_ENV = process.env.NODE_ENV || 'dev'

// Load process.env variables
if (NODE_ENV !== 'dev')
  config({ path: resolve(process.cwd(), `.env.${NODE_ENV}`) })
else
  config()

export const APP_PORT = process.env.APP_PORT || 3000
export const APP_ALLOW_ORIGIN = process.env.APP_ALLOW_ORIGIN || '*'
export const APP_NAME = process.env.APP_NAME || 'mizogoo'
