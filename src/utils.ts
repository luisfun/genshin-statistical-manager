// 平均値
export const mean = (numbers: number[]) => {
  const len = numbers.length
  if (len === 0) return 0
  let sum = 0
  for (let i = 0; i < len; i++) {
    sum += numbers[i]
  }
  return sum / len
}

// 中央値
export const median = (numbers: number[]) => {
  const half = (numbers.length / 2) | 0
  const arr = numbers.sort((a, b) => a - b)
  if (arr.length % 2) return arr[half]
  return (arr[half - 1] + arr[half]) / 2
}
// 「中央値を線形時間で選択するアルゴリズム」は少ないのをたくさんする場合無駄が多い？
// https://techblog.nhn-techorus.com/archives/15289

// 平均値 indexが値 valueがカウント
export const mean2 = (numbers: number[]) => {
  let count = 0
  let sum = 0
  const len = numbers.length
  for (let i = 0; i < len; i++) {
    count += numbers[i]
    sum += i * numbers[i]
  }
  if (count === 0) return 0
  return sum / count
}

// 中央値 indexが値 valueがカウント
export const median2 = (numbers: number[]) => {
  let count = 0
  const rangeMin: number[] = []
  const rangeMax: number[] = []
  const len = numbers.length
  for (let i = 0; i < len; i++) {
    count += numbers[i]
    const tmp = rangeMax[i - 1] || 0
    rangeMin[i] = tmp
    rangeMax[i] = tmp + numbers[i]
  }
  if (count === 0) return 0
  const half = count / 2
  for (let i = 0; i < len; i++) {
    if (rangeMax[i] === half) {
      // 偶数且つ中央値がまたいでいる
      for (let j = 1; j < 10; j++) {
        if (rangeMax[i + j] === half) continue
        return i + j / 2
      }
      return -1 // error
    }
    if (rangeMin[i] < half && half < rangeMax[i]) {
      // 一般解
      return i
    }
  }
  return -1 // error
}

// 最頻値 indexが値 valueがカウント
export const mode2 = (numbers: number[]) => numbers.indexOf(Math.max.apply(null, numbers))
