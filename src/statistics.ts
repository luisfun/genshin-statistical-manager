import type { AvatarInfo, PlayerInfo, Statistics, StatisticsAvatar, StatisticsPlayer, Weapon } from './types'
import { mean, mean2, median, median2, mode2 } from './utils'

const KEY = 'statistics'
const AVATAR_STAT_LIMIT = 3 // 10
const AVATAR_NUM_LIMIT = 5
const AVATAR_PROCESS_LIMIT = 10

type DBKVResult = { key: string; value: string; updated_at: number }
const QUERY_GET_TABLE = 'SELECT name FROM sqlite_master WHERE type="table"'
const QUERY_SET_KV = 'REPLACE INTO key_value (key, updated_at, value) VALUES(?, ?, ?)'
const putDBKV = (db: D1Database, key: string, timestamp: number, value: string) =>
  db.prepare(QUERY_SET_KV).bind(key, timestamp, value).all<undefined>()

/**
 * playerInfo
 * @param {D1Database} db
 */
export const statisticsPlayer = async (db: D1Database) => {
  const lvArr: number[] = [] // レベル
  const acArr: number[] = [] // アチーブメント
  const acArr100: number[] = [] // アチーブメント/100
  const fsArr: number[] = [] // 好感度最大数
  const tfArr: number[] = [] // 螺旋n階
  const taArr: number[] = [] // 幻想シアター階層
  const playerInfoData = (await db.prepare('SELECT data FROM _player').raw<[string]>()).map(
    e => JSON.parse(e[0]) as PlayerInfo,
  )
  // カウント
  for (const p of playerInfoData) {
    const lvIndex = p.level ?? 0
    const acIndex = p.finishAchievementNum ?? 0
    const fsIndex = p.fetterCount ?? 0
    const tfIndex = p.towerFloorIndex ?? 0
    const taIndex = p.theaterActIndex ?? 0
    if (!lvArr[lvIndex]) lvArr[lvIndex] = 0
    if (!acArr[acIndex]) acArr[acIndex] = 0
    if (!fsArr[fsIndex]) fsArr[fsIndex] = 0
    if (!tfArr[tfIndex]) tfArr[tfIndex] = 0
    if (!taArr[taIndex]) taArr[taIndex] = 0
    lvArr[lvIndex]++
    acArr[acIndex]++
    fsArr[fsIndex]++
    tfArr[tfIndex]++
    taArr[taIndex]++
  }
  // 0カウントを整地
  for (let i = 0; i < lvArr.length; i++) lvArr[i] = lvArr[i] ?? 0
  for (let i = 0; i < acArr.length; i++) {
    acArr[i] = acArr[i] ?? 0
    if (i % 100 === 0) acArr100[Math.floor(i / 100)] = 0
    acArr100[Math.floor(i / 100)] += acArr[i]
  }
  for (let i = 0; i < fsArr.length; i++) fsArr[i] = fsArr[i] ?? 0
  for (let i = 0; i < tfArr.length; i++) tfArr[i] = tfArr[i] ?? 0
  for (let i = 0; i < taArr.length; i++) taArr[i] = taArr[i] ?? 0
  const playerInfo: StatisticsPlayer = {
    count: playerInfoData.length,
    level: lvArr,
    finishAchievementNum: acArr,
    finishAchievementNum100: acArr100,
    finishAchievementNumTop: acArr.length - 1,
    fetterCount: fsArr,
    towerFloorIndex: tfArr,
    theaterActIndex: taArr,
  }

  // save
  await putDBKV(db, `${KEY}_player`, Date.now(), JSON.stringify(playerInfo))
}

/**
 * avatarInfo
 * @param {D1Database} db
 */
export const statisticsAvatar = async (db: D1Database) => {
  // ソースID
  const tableIds = (await db.prepare(QUERY_GET_TABLE).raw<[string]>())
    .map(e => e[0])
    .filter(e => /^_\d/.test(e))
    .sort((a, b) => Number(b.slice(1)) - Number(a.slice(1)))
  // 統計済みID
  const statList = (await db.prepare('SELECT key FROM key_value ORDER BY updated_at ASC').raw<[string]>())
    .map(e => e[0])
    .filter(e => tableIds.includes(e.match(/_\d+/)?.[0] ?? ''))
  // 未登録ID ＋ 古い順ID
  const avatarIds = [
    ...tableIds.filter(id => statList.findIndex(s => s === KEY + id) === -1),
    ...(statList.map(s => s.match(/_\d+/)?.[0] ?? undefined).filter(e => e) as string[]),
  ]
  if (avatarIds.length > AVATAR_PROCESS_LIMIT) avatarIds.length = AVATAR_PROCESS_LIMIT

  // 実際の処理
  for (const id of avatarIds) {
    const avatarInfoData = (await db.prepare(`SELECT data FROM ${id}`).raw<[string]>()).map(
      e => JSON.parse(e[0]) as AvatarInfo,
    )
    if (avatarInfoData.length < AVATAR_STAT_LIMIT) continue
    //命の星座
    const coArr = [0, 0, 0, 0, 0, 0, 0]
    // ステータス
    const statArr: { fightProp?: number; values: number[] }[] = [
      { fightProp: 2000, values: [] }, // HP
      { fightProp: 2001, values: [] }, // ATK
      { fightProp: 2002, values: [] }, // DEF
      { fightProp: 28, values: [] }, // Elemental Mastery
      { fightProp: 20, values: [] }, // CRIT Rate
      { fightProp: 22, values: [] }, // CRIT DMG
      { fightProp: 23, values: [] }, // Energy Recharge
      { values: [] }, // Elemental DMG Bonus
    ]
    // 武器
    const wpArr: { id: number; count: number }[] = []
    //聖遺物セット
    const asArr: {
      setId: string
      set: {
        id: number
        piece: number
      }[]
      count: number
    }[] = []
    const isTraveler = id === '_10000005' || id === '_10000007'
    // 旅人の元素
    const travelerElem: { id: number; count: number }[] = []
    // スキル
    const skillArr: { id: number; levels: number[] }[] = []
    for (const a of avatarInfoData) {
      //命の星座
      coArr[a.talentIdList?.length ?? 0]++
      //ステータス
      statArr.find(e => e.fightProp === 2000)?.values.push(a.fightPropMap[2000])
      statArr.find(e => e.fightProp === 2001)?.values.push(a.fightPropMap[2001])
      statArr.find(e => e.fightProp === 2002)?.values.push(a.fightPropMap[2002])
      statArr.find(e => e.fightProp === 28)?.values.push(a.fightPropMap[28])
      statArr.find(e => e.fightProp === 20)?.values.push(a.fightPropMap[20])
      statArr.find(e => e.fightProp === 22)?.values.push(a.fightPropMap[22])
      statArr.find(e => e.fightProp === 23)?.values.push(a.fightPropMap[23])
      statArr
        .find(e => e.fightProp === undefined)
        ?.values.push(
          Math.max(
            a.fightPropMap[30],
            a.fightPropMap[40],
            a.fightPropMap[41],
            a.fightPropMap[42],
            a.fightPropMap[43],
            a.fightPropMap[44],
            a.fightPropMap[45],
            a.fightPropMap[46],
          ),
        )
      //武器
      const weaponInfo: Weapon[] = []
      for (const e of a.equipList ?? []) if ('weapon' in e) weaponInfo.push(e)
      const w = weaponInfo[0]
      const wpArrFind = wpArr.find(e => e.id === w.itemId)
      if (!wpArrFind) {
        wpArr.push({
          id: w.itemId,
          count: 1,
        })
      } else {
        wpArrFind.count++
      }
      //聖遺物
      const setList = get_reliquary_sets(a)
      const setId = `${setList[0]?.id || ''}${setList[0]?.piece || ''}${setList[1]?.id || ''}${setList[1]?.piece || ''}`
      const asArrFind = asArr.find(e => e.setId === setId)
      if (!asArrFind) {
        asArr.push({
          setId: setId,
          set: setList,
          count: 1,
        })
      } else {
        asArrFind.count++
      }
      if (!isTraveler) {
        // スキル
        const skillIdList = Object.keys(a.skillLevelMap).map(e => Number(e))
        for (const id of skillIdList) {
          const skillArrFind = skillArr.find(e => e.id === id)
          if (!skillArrFind) {
            const arr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            arr[a.skillLevelMap[id]]++
            skillArr.push({ id: id, levels: arr })
          } else {
            skillArrFind.levels[a.skillLevelMap[id]]++
          }
        }
      } else {
        // 旅人の元素
        const elementFind = travelerElem.find(e => e.id === a.skillDepotId)
        if (!elementFind) {
          travelerElem.push({
            id: a.skillDepotId,
            count: 1,
          })
        } else {
          elementFind.count++
        }
      }
    }
    wpArr.sort((a, b) => b.count - a.count)
    asArr.sort((a, b) => b.count - a.count)
    if (wpArr.length > AVATAR_NUM_LIMIT) wpArr.length = AVATAR_NUM_LIMIT
    if (asArr.length > AVATAR_NUM_LIMIT) asArr.length = AVATAR_NUM_LIMIT
    const avatarInfo: StatisticsAvatar = {
      avatarId: Number(id.replace('_', '')),
      count: avatarInfoData.length,
      consts: coArr,
      stats: statArr.map(e => ({
        fightProp: e.fightProp,
        value: {
          mean: mean(e.values),
          median: median(e.values),
        },
      })),
      weapon: wpArr,
      reliquarySet: asArr.map(e => ({
        set: e.set,
        count: e.count,
      })),
    }
    if (!isTraveler) {
      avatarInfo.skills = skillArr.map(e => ({
        id: e.id,
        mean: mean2(e.levels),
        median: median2(e.levels),
        mode: mode2(e.levels),
      }))
    } else {
      avatarInfo.travelerElement = travelerElem
    }

    // save
    await putDBKV(db, KEY + id, Date.now(), JSON.stringify(avatarInfo))
  }

  // 統計データをまとめる
  const statData = (await db.prepare('SELECT key, value FROM key_value').raw<[string, string]>()).filter(e =>
    e[0].startsWith(`${KEY}_`),
  )
  const playerInfoRaw = statData.find(e => e[0] === `${KEY}_player`)?.[1]
  if (!playerInfoRaw) throw new Error('playerInfo is missing')
  const playerInfo = JSON.parse(playerInfoRaw) as StatisticsPlayer
  const avatarInfoList = statData.filter(e => e[0].match(/_\d+/)).map(e => JSON.parse(e[1]) as StatisticsAvatar)
  const timestamp = Date.now()
  const stats: Statistics = { playerInfo, avatarInfoList, timestamp }
  // save
  await putDBKV(db, KEY, timestamp, JSON.stringify(stats))
}

// api のほぼコピペ
const get_reliquary_sets = (avatarInfo: AvatarInfo) => {
  const tmpList: {
    icon: string
    nameTextMapHash: string
  }[] = []
  for (const e of avatarInfo.equipList || []) {
    if ('reliquary' in e)
      tmpList.push({
        icon: `${e.flat.icon.slice(0, -1)}4`,
        nameTextMapHash: e.flat.setNameTextMapHash,
      })
  }
  const uniqueId: string[] = [...new Set(tmpList.map(e => e.nameTextMapHash))]
  const setList = uniqueId.map(e => ({
    nameTextMapHash: e,
    icon: tmpList.find(e2 => e2.nameTextMapHash === e)?.icon || 'None',
    count: 0,
  }))
  for (const e of tmpList) setList[setList.findIndex(e2 => e2.nameTextMapHash === e.nameTextMapHash)].count++
  const reList: {
    id: number
    piece: number
  }[] = []
  for (const e of setList) {
    if (e.count < 2) continue
    if (e.count < 4) reList.push({ id: Number(e.icon.slice(-7, -2)), piece: 2 })
    else reList.push({ id: Number(e.icon.slice(-7, -2)), piece: 4 })
  }
  return reList.sort((a, b) => a.id - b.id)
}
