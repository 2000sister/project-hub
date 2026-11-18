/** Koa 应用装配：中间件顺序集中可见 */
import App from 'koa'
import bodyParser from 'koa-bodyparser'
import { config } from './config.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { webStatic } from './middlewares/webStatic.js'
import routes from './routes.js'

export function createApp(): App {
  const app = new App()

  app.use(errorHandler)
  app.use(bodyParser({ jsonLimit: `${Math.floor(config.bodyLimitBytes / 1024 / 1024)}mb` }))
  app.use(routes.routes())
  app.use(routes.allowedMethods())
  app.use(webStatic)

  return app
}
