import app from './config/app.mjs'
import { APP_PORT } from './config/env.mjs'

app.listen(APP_PORT, () => {
  console.log(`Api browse to http://localhost:${APP_PORT}`)
})
