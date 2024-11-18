import { d1Limiter } from './d1-limiter'
import { statistics } from './statistics'

export default {
  async fetch(request, env, ctx) {
    /*
    if (new URL(request.url).pathname === '/') {
      await d1Limiter(env.db, env.PLAYER_LIMIT, env.CHARACTER_LIMIT, env.DAY_LIMIT)
      await statistics(env.db)
    }
    */
    return new Response('Hello World!')
  },
  async scheduled(controller, env, ctx) {
    await d1Limiter(env.db, env.PLAYER_LIMIT, env.CHARACTER_LIMIT, env.DAY_LIMIT)
    await statistics(env.db)
  },
} satisfies ExportedHandler<Env>
