// API
export type PlayerInfo = {
  nickname: string
  level: number
  signature?: string
  worldLevel?: number
  nameCardId: number
  finishAchievementNum?: number
  towerFloorIndex?: number
  towerLevelIndex?: number
  showAvatarInfoList?: {
    avatarId: number
    level: number
    costumeId?: number
    energyType?: number
    talentLevel?: number
  }[]
  showNameCardIdList?: number[]
  profilePicture: {
    id?: number
    avatarId?: number
  }
  fetterCount?: number
  isShowAvatarTalent?: boolean
  towerStarIndex?: number
  theaterActIndex?: number
  theaterModeIndex?: number
  theaterStarIndex?: number
}

export type AvatarInfo = {
  avatarId: number
  propMap: {
    [index: string]: {
      type: number
      ival: string
      val?: string
    }
  }
  talentIdList?: number[]
  fightPropMap: {
    [index: string]: number
  }
  skillDepotId: number
  inherentProudSkillList: number[]
  skillLevelMap: {
    [index: string]: number
  }
  proudSkillExtraLevelMap?: {
    [index: string]: number
  }
  equipList?: (Weapon | Reliquary)[]
  fetterInfo: {
    expLevel: number // 好感度
  }
  costumeId?: number
}

export type Weapon = {
  itemId: number
  weapon: {
    level: number
    promoteLevel?: number
    affixMap?: {
      [index: string]: number // 0-4
    }
  }
  flat: {
    nameTextMapHash: string
    rankLevel: number
    weaponStats: {
      appendPropId: string
      statValue: number
    }[]
    itemType: string
    icon: string
  }
}

export type Reliquary = {
  itemId: number
  reliquary: {
    level: number
    mainPropId: number
    appendPropIdList?: number[]
  }
  flat: {
    nameTextMapHash: string
    setNameTextMapHash: string
    rankLevel: number
    reliquaryMainstat: {
      mainPropId: string
      statValue: number
    }
    reliquarySubstats?: {
      appendPropId: string
      statValue: number
    }[]
    itemType: string
    icon: string
    equipType: string
  }
}

// Statistics
export type StatisticsAvatar = {
  avatarId: number
  count: number
  // 旅人の元素
  travelerElement?: {
    id: number // skillDepotId
    count: number
  }[]
  // 命ノ星座
  consts: number[]
  // 旅人以外 天賦
  skills?: {
    id: number
    mean: number
    median: number
    mode: number
  }[]
  stats: {
    fightProp: number | undefined
    value: {
      mean: number
      median: number
    }
  }[]
  weapon: {
    id: number
    count: number
  }[]
  reliquarySet: {
    set: {
      id: number
      piece: number
    }[]
    count: number
  }[]
}

export type StatisticsPlayer = {
  count: number
  level: number[]
  finishAchievementNum: number[]
  finishAchievementNum100: number[]
  finishAchievementNumTop: number
  fetterCount: number[]
  towerFloorIndex: number[]
  theaterActIndex: number[]
}

export type Statistics = {
  playerInfo: StatisticsPlayer
  avatarInfoList: StatisticsAvatar[]
  timestamp: number
}
