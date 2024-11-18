export const d1Limiter = async (db: D1Database, player: number, num: number, day: number) => {
  const now_at = Date.now()
  const limit_at = now_at - day * 24 * 60 * 60 * 1000
  // playerの最大数のupdated_atを取得、なければ全体のlimit_at
  const player_limit_at =
    (await db
      .prepare('SELECT updated_at FROM player ORDER BY updated_at DESC LIMIT ?, 1')
      .bind(player)
      .first<number>('updated_at')) || limit_at
  // avatarのテーブルリスト取得（IDの取得）
  const avatar_ids = (await db.prepare('SELECT name FROM sqlite_master WHERE type="table"').raw<string[]>())
    .map(e => e[0])
    .filter(e => /^_\d/.test(e))
  if (!avatar_ids[0]) return // error
  // avatarの数取得
  const avatar_counts = (await db.batch([...avatar_ids.map(e => db.prepare(`SELECT count(*) FROM ${e}`))])).map(
    e => (e.results[0] as { 'count(*)': number })['count(*)'],
  )
  // avatarのupdated_at取得
  const avatar_updated_at = (
    await db.batch([...avatar_ids.map(e => db.prepare(`SELECT updated_at FROM ${e} ORDER BY updated_at LIMIT 1`))])
  ).map(e => (e.results[0] as { updated_at: number } | undefined)?.updated_at)
  // avatarのupdated_at閾値
  const avatar_limit_at = avatar_ids.map((_, i) =>
    calcTime(now_at, limit_at, num, avatar_updated_at[i], avatar_counts[i]),
  )
  // limit処理
  await db.batch([
    // 古いplayerの削除
    db
      .prepare('DELETE FROM player WHERE updated_at <= ?')
      .bind(player_limit_at),
    // 古いavatarの削除
    ...avatar_ids
      .filter((_, i) => avatar_updated_at[i] && avatar_limit_at[i] < avatar_updated_at[i])
      .map((e, i) => db.prepare(`DELETE FROM ${e} WHERE updated_at < ?`).bind(avatar_limit_at[i])),
  ])
}

const calcTime = (
  now_at: number,
  limit_at: number,
  limit_num: number,
  table_at: number | undefined,
  table_count: number,
) => {
  // https://imagingsolution.blog.fc2.com/blog-entry-137.html
  const p1 = { x: limit_at, y: 0 } // リミット線
  const p2 = { x: now_at, y: 0 } // 0点
  const p3 = { x: now_at, y: limit_num } // リミット線
  const p4 = { x: table_at ?? limit_at, y: table_count } // 現在の値
  const s1 = ((p4.x - p2.x) * (p1.y - p2.y) - (p4.y - p2.y) * (p1.x - p2.x)) / 2
  const s2 = ((p4.x - p2.x) * (p2.y - p3.y) - (p4.y - p2.y) * (p2.x - p3.x)) / 2
  const cx = p1.x + ((p3.x - p1.x) * s1) / (s1 + s2) // 制限するat
  //const cy = p1.y+(p3.y-p1.y)*s1/(s1+s2)
  return cx
}
