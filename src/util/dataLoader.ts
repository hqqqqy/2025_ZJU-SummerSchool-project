// src/util/dataLoader.ts
import type {
  UserProfile,
  UserBehaviorData,
  TimeSeriesDataPoint,
  HeatmapDataPoint,
  ScatterDataPoint,
  AccountRole,
  AccountInterest
} from '@/models'

// CSV 行数据类型
interface CSVRow {
  user_id: string
  registration_date: string
  location?: string
  last_active_date: string
  role: string
  interests: string
  post_count: string
  like_count: string
  repost_count: string
  comment_count: string
  follower_count: string
  following_count: string
  interactions: string
}

// 有效的兴趣分类
const VALID_INTERESTS = [
  'animals',
  'arts and culture',
  'business and finance',
  'entertainment',
  'fashion and beauty',
  'fitness and health',
  'food and dining',
  'learning and educational',
  'politics',
  'science and technology',
  'sports',
  'travel'
] as const

// 有效的用户角色
const VALID_ROLES = [
  'inactive',
  'information-seeker',
  'information-source',
  'general'
] as const

/**
 * 处理 CSV 数据并转换为系统所需格式
 * @param csvData CSV 字符串
 * @returns 转换后的用户档案和行为数据
 */
export function processCSVData(csvData: string): {
  userProfiles: UserProfile[]
  userBehaviors: UserBehaviorData[]
  timeSeriesData: TimeSeriesDataPoint[]
  heatmapData: HeatmapDataPoint[]
  scatterData: ScatterDataPoint[]
} {
  // 1. 解析 CSV
  const rows = parseCSV(csvData)
  if (rows.length === 0) {
    throw new Error('CSV 数据为空或格式不正确')
  }

  // 2. 数据转换
  const { userProfiles, userBehaviors } = transformRows(rows)

  // 3. 生成可视化数据
  return {
    userProfiles,
    userBehaviors,
    timeSeriesData: generateTimeSeriesData(userBehaviors),
    heatmapData: generateHeatmapData(userBehaviors),
    scatterData: generateScatterData(userProfiles, userBehaviors)
  }
}

/**
 * 解析 CSV 字符串为对象数组
 */
function parseCSV(csv: string): CSVRow[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })
    
    return row as unknown as CSVRow
  })
}

/**
 * 转换原始数据行
 */
function transformRows(rows: CSVRow[]): {
  userProfiles: UserProfile[]
  userBehaviors: UserBehaviorData[]
} {
  // 计算最大最小值用于归一化
  const { maxPosts, maxInteractions, maxFollowers, maxDaysSinceActive } = calculateMaxValues(rows)
  
  const userProfiles: UserProfile[] = []
  const userBehaviors: UserBehaviorData[] = []
  const now = new Date()

  rows.forEach(row => {
    // 验证角色类型
    if (!isValidRole(row.role)) {
      console.warn(`无效的用户角色: ${row.role}，使用默认值 'general'`)
      row.role = 'general'
    }

    // 处理兴趣列表
    const interests = row.interests.split(';')
      .map(i => i.trim().toLowerCase())
      .filter(i => isValidInterest(i)) as AccountInterest[]

    // 创建用户档案
    userProfiles.push({
      userId: row.user_id,
      role: row.role as AccountRole,
      interests: interests.length > 0 ? interests : ['general'],
      registrationDate: parseDate(row.registration_date),
      location: row.location?.trim() || undefined
    })

    // 计算行为数据
    const postCount = parseInt(row.post_count) || 0
    const interactionCount = parseInt(row.interactions) || 0
    const followerCount = parseInt(row.follower_count) || 0
    const lastActiveDate = parseDate(row.last_active_date)

    userBehaviors.push({
      userId: row.user_id,
      activityScore: calculateActivityScore(
        postCount,
        interactionCount,
        lastActiveDate,
        maxPosts,
        maxInteractions,
        maxDaysSinceActive,
        now
      ),
      influenceScore: calculateInfluenceScore(
        followerCount,
        interactionCount,
        maxFollowers,
        maxInteractions
      ),
      postCount,
      interactionCount,
      followerCount,
      followingCount: parseInt(row.following_count) || 0,
      lastActiveDate: lastActiveDate.toISOString()
    })
  })

  return { userProfiles, userBehaviors }
}

/**
 * 计算活动分数 (0-100)
 */
function calculateActivityScore(
  postCount: number,
  interactionCount: number,
  lastActiveDate: Date,
  maxPosts: number,
  maxInteractions: number,
  maxDaysSinceActive: number,
  now: Date
): number {
  const daysSinceActive = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
  const recencyFactor = 1 - (daysSinceActive / maxDaysSinceActive)
  
  const normalizedPosts = postCount / maxPosts
  const normalizedInteractions = interactionCount / maxInteractions
  
  // 加权计算 (发帖 40% + 互动 30% + 时效性 30%)
  const score = (normalizedPosts * 0.4) + (normalizedInteractions * 0.3) + (recencyFactor * 0.3)
  
  return Math.round(score * 100)
}

/**
 * 计算影响力分数 (0-100)
 */
function calculateInfluenceScore(
  followerCount: number,
  interactionCount: number,
  maxFollowers: number,
  maxInteractions: number
): number {
  const normalizedFollowers = followerCount / maxFollowers
  const normalizedInteractions = interactionCount / maxInteractions
  
  // 加权计算 (粉丝数 60% + 互动量 40%)
  const score = (normalizedFollowers * 0.6) + (normalizedInteractions * 0.4)
  
  return Math.round(score * 100)
}

/**
 * 生成时间序列数据
 */
function generateTimeSeriesData(behaviors: UserBehaviorData[]): TimeSeriesDataPoint[] {
  const dateMap = new Map<string, TimeSeriesDataPoint>()
  
  behaviors.forEach(behavior => {
    const date = behavior.lastActiveDate.split('T')[0]
    const point = dateMap.get(date) || createEmptyDataPoint(date)
    
    point.activeUserCount++
    point.postCount += behavior.postCount
    point.interactionCount += behavior.interactionCount
    point.avgActivityScore = (point.avgActivityScore * (point.activeUserCount - 1) + behavior.activityScore) / point.activeUserCount
    point.avgInfluenceScore = (point.avgInfluenceScore * (point.activeUserCount - 1) + behavior.influenceScore) / point.activeUserCount
    
    dateMap.set(date, point)
  })
  
  return Array.from(dateMap.values()).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

/**
 * 生成热力图数据
 */
function generateHeatmapData(behaviors: UserBehaviorData[]): HeatmapDataPoint[] {
  const hourMap = new Map<string, HeatmapDataPoint>()
  
  behaviors.forEach(behavior => {
    const date = new Date(behavior.lastActiveDate)
    const hour = date.getHours()
    const dayOfWeek = date.getDay() // 0-6 (Sunday-Saturday)
    const key = `${hour}-${dayOfWeek}`
    
    const point = hourMap.get(key) || {
      hour,
      dayOfWeek,
      value: 0,
      userCount: 0,
      postCount: 0
    }
    
    point.value += behavior.activityScore
    point.userCount++
    point.postCount += behavior.postCount
    hourMap.set(key, point)
  })
  
  // 计算每小时的平均活跃度
  return Array.from(hourMap.values()).map(point => ({
    ...point,
    value: point.value / point.userCount
  }))
}

/**
 * 生成散点图数据
 */
function generateScatterData(
  profiles: UserProfile[],
  behaviors: UserBehaviorData[]
): ScatterDataPoint[] {
  return behaviors.map(behavior => {
    const profile = profiles.find(p => p.userId === behavior.userId)!
    return {
      userId: behavior.userId,
      activityScore: behavior.activityScore,
      influenceScore: behavior.influenceScore,
      role: profile.role,
      interests: profile.interests,
      postCount: behavior.postCount,
      interactionCount: behavior.interactionCount
    }
  })
}

// 辅助函数
function calculateMaxValues(rows: CSVRow[]) {
  let maxPosts = 1, maxInteractions = 1, maxFollowers = 1, maxDaysSinceActive = 1
  const now = new Date()
  
  rows.forEach(row => {
    maxPosts = Math.max(maxPosts, parseInt(row.post_count) || 0)
    maxInteractions = Math.max(maxInteractions, parseInt(row.interactions) || 0)
    maxFollowers = Math.max(maxFollowers, parseInt(row.follower_count) || 0)
    
    const lastActive = parseDate(row.last_active_date)
    const days = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    maxDaysSinceActive = Math.max(maxDaysSinceActive, days)
  })
  
  return { maxPosts, maxInteractions, maxFollowers, maxDaysSinceActive }
}

function createEmptyDataPoint(date: string): TimeSeriesDataPoint {
  return {
    timestamp: date,
    activeUserCount: 0,
    newUserCount: 0,
    postCount: 0,
    interactionCount: 0,
    avgActivityScore: 0,
    avgInfluenceScore: 0
  }
}

function parseDate(dateStr: string): Date {
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? new Date() : date
}

function isValidRole(role: string): role is AccountRole {
  return VALID_ROLES.includes(role as AccountRole)
}

function isValidInterest(interest: string): interest is AccountInterest {
  return VALID_INTERESTS.includes(interest as AccountInterest)
}
