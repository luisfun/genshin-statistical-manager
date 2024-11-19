import { d1Limiter } from './d1-limiter'
import { statisticsAvatar, statisticsPlayer } from './statistics'

export default {
  async fetch(request, env, ctx) {
    /*
    if (new URL(request.url).pathname === '/') {
      await d1Limiter(env.db, env.PLAYER_LIMIT, env.CHARACTER_LIMIT, env.DAY_LIMIT)
      await statisticsPlayer(env.db)
      await statisticsAvatar(env.db)
    }
    */
    return new Response('Hello World!')
  },
  async scheduled(controller, env, ctx) {
    switch (controller.cron) {
      case '0 1,9,17 * * *':
        await d1Limiter(env.db, env.PLAYER_LIMIT, env.CHARACTER_LIMIT, env.DAY_LIMIT)
        await statisticsPlayer(env.db)
        break
      case '0 0,2-8,10-16,18-23 * * *':
        await statisticsAvatar(env.db)
        break
      default:
        new Error('Unknown scheduled Trigger')
        break
    }
  },
} satisfies ExportedHandler<Env>
