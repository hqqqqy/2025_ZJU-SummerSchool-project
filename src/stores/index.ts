// ===========================================
// 微博用户行为分析状态管理
// ===========================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  FilterCondition,
  SelectionState,
  InteractionRecord,
  ViewConfig,
  ViewType,
  UserProfile,
  UserBehaviorData,
  TimeSeriesDataPoint,
  HeatmapDataPoint,
  ScatterDataPoint,
  NetworkNode,
  NetworkEdge,
  WordCloudItem,
  GeographicDataPoint,
  AggregatedStats,
  AccountRole,
  AccountInterest
} from '@/models'

// ===========================================
// 主要分析状态管理
// ===========================================

export const useAnalysisStore = defineStore('analysis', () => {
  // ===========================================
  // 数据状态
  // ===========================================
  
  const userProfiles = ref<UserProfile[]>([])
  const userBehaviors = ref<UserBehaviorData[]>([])
  const timeSeriesData = ref<TimeSeriesDataPoint[]>([])
  const heatmapData = ref<HeatmapDataPoint[]>([])
  const scatterData = ref<ScatterDataPoint[]>([])
  const networkNodes = ref<NetworkNode[]>([])
  const networkEdges = ref<NetworkEdge[]>([])
  const wordCloudData = ref<WordCloudItem[]>([])
  const geographicData = ref<GeographicDataPoint[]>([])
  const aggregatedStats = ref<AggregatedStats | null>(null)

  // ===========================================
  // 筛选和交互状态
  // ===========================================
  
  const filterCondition = ref<FilterCondition>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 默认30天前
      end: new Date().toISOString().split('T')[0] // 今天
    },
    activityRange: { min: 0, max: 100 },
    influenceRange: { min: 0, max: 100 },
    roles: [],
    interests: [],
    regions: [],
    userIds: []
  })

  const selectionState = ref<SelectionState>({
    selectedUserIds: [],
    selectedRole: undefined,
    selectedInterest: undefined,
    selectedRegion: undefined,
    selectedTimeRange: undefined
  })

  const interactionHistory = ref<InteractionRecord[]>([])
  const isLoading = ref(false)
  const lastUpdateTime = ref<string>('')

  // hover状态管理，支持跨图表联动
  const hoverState = ref<{
    hoveredRole?: AccountRole
    hoveredInterest?: AccountInterest
    hoveredUserId?: string
    sourceChart?: string
  }>({})

  const highlightState = ref<{
    highlightedRole?: AccountRole
    highlightedInterest?: AccountInterest
    highlightedUserIds?: string[]
  }>({})

  // ===========================================
  // 视图配置状态
  // ===========================================
  
  const viewConfigs = ref<Record<ViewType, ViewConfig>>({
    timeSeries: {
      viewType: 'timeSeries',
      title: '时间序列分析',
      isVisible: true,
      position: { x: 0, y: 0, width: 50, height: 50 },
      config: { aggregationLevel: 'day', showMetrics: ['activeUsers', 'posts'] }
    },
    scatter: {
      viewType: 'scatter',
      title: '散点图分析',
      isVisible: true,
      position: { x: 50, y: 0, width: 50, height: 50 },
      config: { colorBy: 'role', enableSelection: true }
    },
    heatmap: {
      viewType: 'heatmap',
      title: '活跃度热力图',
      isVisible: true,
      position: { x: 0, y: 50, width: 33, height: 50 },
      config: { showLabels: true }
    },
    pieChart: {
      viewType: 'pieChart',
      title: '用户分布',
      isVisible: true,
      position: { x: 33, y: 50, width: 33, height: 50 },
      config: { chartType: 'role' }
    },
    network: {
      viewType: 'network',
      title: '关系网络',
      isVisible: true,
      position: { x: 66, y: 50, width: 34, height: 50 },
      config: { layout: 'force', nodeSize: 'influence' }
    },
    wordcloud: {
      viewType: 'wordcloud',
      title: '词云分析',
      isVisible: false,
      position: { x: 0, y: 0, width: 50, height: 50 },
      config: { maxWords: 100 }
    },
    geographic: {
      viewType: 'geographic',
      title: '地域分布',
      isVisible: false,
      position: { x: 50, y: 0, width: 50, height: 50 },
      config: { mapType: 'china' }
    }
  })

  // ===========================================
  // 计算属性
  // ===========================================
  
  // 过滤后的数据
  const filteredUserProfiles = computed(() => {
    return userProfiles.value.filter(user => {
      const condition = filterCondition.value
      
      // 角色筛选
      if (condition.roles && condition.roles.length > 0 && !condition.roles.includes(user.role)) {
        return false
      }
      
      // 兴趣筛选
      if (condition.interests && condition.interests.length > 0) {
        const hasMatchingInterest = user.interests.some(interest => condition.interests!.includes(interest))
        if (!hasMatchingInterest) return false
      }
      
      // 地区筛选
      if (condition.regions && condition.regions.length > 0 && user.location) {
        if (!condition.regions.includes(user.location)) return false
      }
      
      // 用户ID筛选
      if (condition.userIds && condition.userIds.length > 0 && !condition.userIds.includes(user.userId)) {
        return false
      }
      
      return true
    })
  })

  const filteredUserBehaviors = computed(() => {
    const filteredUserIds = new Set(filteredUserProfiles.value.map(u => u.userId))
    return userBehaviors.value.filter(behavior => {
      if (!filteredUserIds.has(behavior.userId)) return false
      
      const condition = filterCondition.value
      
      // 活跃度筛选
      if (condition.activityRange) {
        if (behavior.activityScore < condition.activityRange.min || 
            behavior.activityScore > condition.activityRange.max) {
          return false
        }
      }
      
      // 影响力筛选
      if (condition.influenceRange) {
        if (behavior.influenceScore < condition.influenceRange.min || 
            behavior.influenceScore > condition.influenceRange.max) {
          return false
        }
      }
      
      return true
    })
  })

  const filteredTimeSeriesData = computed(() => {
    if (!filterCondition.value.dateRange) return timeSeriesData.value
    
    const start = new Date(filterCondition.value.dateRange.start)
    const end = new Date(filterCondition.value.dateRange.end)
    
    return timeSeriesData.value.filter(point => {
      const timestamp = new Date(point.timestamp)
      return timestamp >= start && timestamp <= end
    })
  })

  // 可见视图配置
  const visibleViews = computed(() => {
    return Object.values(viewConfigs.value).filter(config => config.isVisible)
  })

  // 当前筛选条件的统计信息
  const currentStats = computed(() => {
    const filteredBehaviors = filteredUserBehaviors.value
    if (filteredBehaviors.length === 0) return null

    const totalUsers = filteredBehaviors.length
    const totalPosts = filteredBehaviors.reduce((sum, b) => sum + b.postCount, 0)
    const totalInteractions = filteredBehaviors.reduce((sum, b) => sum + b.interactionCount, 0)
    const avgActivity = filteredBehaviors.reduce((sum, b) => sum + b.activityScore, 0) / totalUsers
    const avgInfluence = filteredBehaviors.reduce((sum, b) => sum + b.influenceScore, 0) / totalUsers

    return {
      totalUsers,
      activeUsers: filteredBehaviors.filter(b => b.activityScore > 30).length,
      totalPosts,
      totalInteractions,
      avgActivityScore: avgActivity,
      avgInfluenceScore: avgInfluence,
      roleDistribution: getRoleDistribution(),
      interestDistribution: getInterestDistribution()
    }
  })

  // ===========================================
  // 状态操作方法
  // ===========================================
  
  // 更新筛选条件
  function updateFilter(newFilter: Partial<FilterCondition>) {
    filterCondition.value = { ...filterCondition.value, ...newFilter }
    addInteractionRecord('filter', 'global', '更新筛选条件', newFilter)
  }

  // 重置筛选条件
  function resetFilter() {
    filterCondition.value = {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      activityRange: { min: 0, max: 100 },
      influenceRange: { min: 0, max: 100 },
      roles: [],
      interests: [],
      regions: [],
      userIds: []
    }
    clearSelection()
  }

  // 更新选择状态
  function updateSelection(newSelection: Partial<SelectionState>) {
    selectionState.value = { ...selectionState.value, ...newSelection }
    addInteractionRecord('select', 'global', '更新选择状态', undefined, newSelection)
  }

  // 清除选择
  function clearSelection() {
    selectionState.value = {
      selectedUserIds: [],
      selectedRole: undefined,
      selectedInterest: undefined,
      selectedRegion: undefined,
      selectedTimeRange: undefined
    }
  }

  // 添加交互记录
  function addInteractionRecord(
    action: InteractionRecord['action'],
    viewType: ViewType | 'global',
    description: string,
    filterCondition?: Partial<FilterCondition>,
    selectionState?: Partial<SelectionState>
  ) {
    const record: InteractionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      viewType: viewType as ViewType,
      description,
      filterCondition,
      selectionState: selectionState as SelectionState
    }
    
    interactionHistory.value.unshift(record)
    
    // 保持最近50条记录
    if (interactionHistory.value.length > 50) {
      interactionHistory.value = interactionHistory.value.slice(0, 50)
    }
  }

  // 回退到历史状态
  function revertToHistory(recordId: string) {
    const record = interactionHistory.value.find(r => r.id === recordId)
    if (!record) return

    if (record.filterCondition) {
      updateFilter(record.filterCondition)
    }
    if (record.selectionState) {
      updateSelection(record.selectionState)
    }
  }

  // 更新视图配置
  function updateViewConfig(viewType: ViewType, config: Partial<ViewConfig>) {
    viewConfigs.value[viewType] = { ...viewConfigs.value[viewType], ...config }
  }

  // 切换视图可见性
  function toggleViewVisibility(viewType: ViewType) {
    viewConfigs.value[viewType].isVisible = !viewConfigs.value[viewType].isVisible
  }

  // ===========================================
  // hover状态管理方法
  // ===========================================
  
  // 设置hover状态
  function setHoverState(newHoverState: {
    hoveredRole?: AccountRole
    hoveredInterest?: AccountInterest
    hoveredUserId?: string
    sourceChart?: string
  }) {
    hoverState.value = { ...newHoverState }
  }

  // 清除hover状态
  function clearHoverState() {
    hoverState.value = {}
  }

  // 设置高亮状态
  function setHighlightState(newHighlightState: {
    highlightedRole?: AccountRole
    highlightedInterest?: AccountInterest
    highlightedUserIds?: string[]
  }) {
    highlightState.value = { ...newHighlightState }
  }

  // 清除高亮状态
  function clearHighlightState() {
    highlightState.value = {}
  }

  // ===========================================
  // 数据加载方法
  // ===========================================
  
  async function loadData() {
    isLoading.value = true
    try {
      console.log('加载CSV数据文件...')
      
      // 加载用户配置和行为数据
      try {
        const userDataResponse = await fetch('/sample-data.csv')
        const userDataText = await userDataResponse.text()
        const userLines = userDataText.split('\n').filter(line => line.trim())
        
        if (userLines.length > 1) {
          const userHeaders = userLines[0].split(',')
          const newUserProfiles: UserProfile[] = []
          const newUserBehaviors: UserBehaviorData[] = []
          
          for (let i = 1; i < userLines.length; i++) {
            const values = userLines[i].split(',')
            if (values.length >= userHeaders.length) {
              const userId = values[0]
              const role = values[1] as AccountRole
              const interests = values[2].replace(/"/g, '').split(',').filter(i => i.trim()) as AccountInterest[]
              const registrationDate = values[3]
              const location = values[4]
              const activityScore = isNaN(parseFloat(values[5])) ? 0 : parseFloat(values[5])
              const influenceScore = isNaN(parseFloat(values[6])) ? 0 : parseFloat(values[6])
              const postCount = isNaN(parseInt(values[7])) ? 0 : parseInt(values[7])
              const interactionCount = isNaN(parseInt(values[8])) ? 0 : parseInt(values[8])
              const followerCount = isNaN(parseInt(values[9])) ? 0 : parseInt(values[9])
              const followingCount = isNaN(parseInt(values[10])) ? 0 : parseInt(values[10])
              const lastActiveDate = values[11]
              
              newUserProfiles.push({
                userId,
                role,
                interests,
                registrationDate,
                location
              })
              
              newUserBehaviors.push({
                userId,
                activityScore,
                influenceScore,
                postCount,
                interactionCount,
                followerCount,
                followingCount,
                lastActiveDate
              })
            }
          }
          
          userProfiles.value = newUserProfiles
          userBehaviors.value = newUserBehaviors
          console.log(`加载了 ${newUserProfiles.length} 个用户数据`)
        }
      } catch (error) {
        console.warn('用户数据文件加载失败:', error)
      }
      
      // 加载时间序列数据
      try {
        const timeSeriesResponse = await fetch('/sample-timeseries.csv')
        const timeSeriesText = await timeSeriesResponse.text()
        const timeSeriesLines = timeSeriesText.split('\n').filter(line => line.trim())
        
        if (timeSeriesLines.length > 1) {
          const headers = timeSeriesLines[0].split(',')
          const newTimeSeriesData: TimeSeriesDataPoint[] = []
          
          for (let i = 1; i < timeSeriesLines.length; i++) {
            const values = timeSeriesLines[i].split(',')
            if (values.length >= headers.length) {
              newTimeSeriesData.push({
                timestamp: values[0],
                activeUserCount: isNaN(parseInt(values[1])) ? 0 : parseInt(values[1]),
                newUserCount: isNaN(parseInt(values[2])) ? 0 : parseInt(values[2]),
                postCount: isNaN(parseInt(values[3])) ? 0 : parseInt(values[3]),
                interactionCount: isNaN(parseInt(values[4])) ? 0 : parseInt(values[4]),
                avgActivityScore: isNaN(parseFloat(values[5])) ? 0 : parseFloat(values[5]),
                avgInfluenceScore: isNaN(parseFloat(values[6])) ? 0 : parseFloat(values[6])
              })
            }
          }
          
          timeSeriesData.value = newTimeSeriesData
          console.log(`加载了 ${newTimeSeriesData.length} 个时间序列数据点`)
        }
      } catch (error) {
        console.warn('时间序列数据文件加载失败:', error)
      }
      
      // 生成衍生数据
      await generateDerivedData()
      updateAggregatedStats()
      
      lastUpdateTime.value = new Date().toISOString()
      console.log('数据加载完成')
    } catch (error) {
      console.error('Failed to load data:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // ===========================================
  // 数据导入方法
  // ===========================================
  
  // 导入CSV数据
  async function importData(importedData: {
    userProfiles?: UserProfile[]
    userBehaviors?: UserBehaviorData[]
    timeSeriesData?: TimeSeriesDataPoint[]
    rawData: Record<string, any>[]
  }) {
    isLoading.value = true
    
    try {
      // 导入用户配置数据
      if (importedData.userProfiles && importedData.userProfiles.length > 0) {
        // 合并或替换用户配置数据
        const existingUserIds = new Set(userProfiles.value.map(u => u.userId))
        const newProfiles = importedData.userProfiles.filter(profile => !existingUserIds.has(profile.userId))
        const updatedProfiles = importedData.userProfiles.filter(profile => existingUserIds.has(profile.userId))
        
        // 添加新用户
        userProfiles.value.push(...newProfiles)
        
        // 更新已存在的用户
        updatedProfiles.forEach(updatedProfile => {
          const index = userProfiles.value.findIndex(p => p.userId === updatedProfile.userId)
          if (index !== -1) {
            userProfiles.value[index] = { ...userProfiles.value[index], ...updatedProfile }
          }
        })
        
        console.log(`导入了 ${newProfiles.length} 个新用户配置，更新了 ${updatedProfiles.length} 个用户配置`)
      }

      // 导入用户行为数据
      if (importedData.userBehaviors && importedData.userBehaviors.length > 0) {
        const existingUserIds = new Set(userBehaviors.value.map(u => u.userId))
        const newBehaviors = importedData.userBehaviors.filter(behavior => !existingUserIds.has(behavior.userId))
        const updatedBehaviors = importedData.userBehaviors.filter(behavior => existingUserIds.has(behavior.userId))
        
        // 添加新用户行为数据
        userBehaviors.value.push(...newBehaviors)
        
        // 更新已存在的用户行为数据
        updatedBehaviors.forEach(updatedBehavior => {
          const index = userBehaviors.value.findIndex(b => b.userId === updatedBehavior.userId)
          if (index !== -1) {
            userBehaviors.value[index] = { ...userBehaviors.value[index], ...updatedBehavior }
          }
        })

        console.log(`导入了 ${newBehaviors.length} 个新用户行为数据，更新了 ${updatedBehaviors.length} 个用户行为数据`)
      }

      // 导入时间序列数据
      if (importedData.timeSeriesData && importedData.timeSeriesData.length > 0) {
        // 按时间戳合并时间序列数据，避免重复
        const existingTimestamps = new Set(timeSeriesData.value.map(t => t.timestamp))
        const newTimeSeriesData = importedData.timeSeriesData.filter(
          dataPoint => !existingTimestamps.has(dataPoint.timestamp)
        )
        
        timeSeriesData.value.push(...newTimeSeriesData)
        // 按时间排序
        timeSeriesData.value.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        
        console.log(`导入了 ${newTimeSeriesData.length} 个时间序列数据点`)
      }

      // 生成其他相关数据
      await generateDerivedData()
      
      // 更新统计信息
      updateAggregatedStats()
      
      lastUpdateTime.value = new Date().toISOString()
      
      // 记录导入操作
      addInteractionRecord(
        'filter', 
        'global', 
        `导入CSV数据: ${importedData.rawData.length} 条记录`, 
        filterCondition.value
      )
      
      return {
        success: true,
        message: '数据导入成功',
        summary: {
          userProfiles: importedData.userProfiles?.length || 0,
          userBehaviors: importedData.userBehaviors?.length || 0,
          timeSeriesData: importedData.timeSeriesData?.length || 0,
          totalRecords: importedData.rawData.length
        }
      }
      
    } catch (error) {
      console.error('数据导入失败:', error)
      throw new Error(error instanceof Error ? error.message : '数据导入失败')
    } finally {
      isLoading.value = false
    }
  }

  // 生成衍生数据（散点图、热力图、网络数据等）
  async function generateDerivedData() {
    // 生成散点图数据
    scatterData.value = userBehaviors.value.map(behavior => {
      const profile = userProfiles.value.find(p => p.userId === behavior.userId)
      return {
        userId: behavior.userId,
        activityScore: behavior.activityScore,
        influenceScore: behavior.influenceScore,
        role: profile?.role || 'general',
        interests: profile?.interests || [],
        postCount: behavior.postCount,
        interactionCount: behavior.interactionCount
      } as ScatterDataPoint
    })

    // 生成热力图数据（基于时间序列数据）
    if (timeSeriesData.value.length > 0) {
      const heatmapMap = new Map<string, {
        hour: number
        dayOfWeek: number
        values: number[]
        userCounts: number[]
        postCounts: number[]
      }>()
      
      // 收集每个时段的所有数据点
      timeSeriesData.value.forEach(point => {
        const date = new Date(point.timestamp)
        const hour = date.getHours()
        const dayOfWeek = date.getDay()
        const key = `${hour}-${dayOfWeek}`
        
        if (heatmapMap.has(key)) {
          const existing = heatmapMap.get(key)!
          existing.values.push(point.activeUserCount)
          existing.userCounts.push(point.activeUserCount)
          existing.postCounts.push(point.postCount)
        } else {
          heatmapMap.set(key, {
            hour,
            dayOfWeek,
            values: [point.activeUserCount],
            userCounts: [point.activeUserCount],
            postCounts: [point.postCount]
          })
        }
      })
      
      // 计算每个时段的平均值
      heatmapData.value = Array.from(heatmapMap.values()).map(item => {
        const avgValue = item.values.length > 0 
          ? item.values.reduce((sum, val) => sum + (isNaN(val) ? 0 : val), 0) / item.values.length 
          : 0
        const avgUserCount = item.userCounts.length > 0 
          ? item.userCounts.reduce((sum, val) => sum + (isNaN(val) ? 0 : val), 0) / item.userCounts.length 
          : 0
        const avgPostCount = item.postCounts.length > 0 
          ? item.postCounts.reduce((sum, val) => sum + (isNaN(val) ? 0 : val), 0) / item.postCounts.length 
          : 0
        
        return {
          hour: item.hour,
          dayOfWeek: item.dayOfWeek,
          value: isNaN(avgValue) ? 0 : avgValue,
          userCount: Math.round(isNaN(avgUserCount) ? 0 : avgUserCount),
          postCount: Math.round(isNaN(avgPostCount) ? 0 : avgPostCount)
        } as HeatmapDataPoint
      })
      
      console.log(`生成了 ${heatmapData.value.length} 个热力图数据点`)
      console.log('热力图数据示例:', heatmapData.value.slice(0, 3))
    } else {
      console.log('没有时间序列数据，热力图将使用模拟数据')
      console.log('当前timeSeriesData.value:', timeSeriesData.value)
    }

    // 生成网络节点数据
    networkNodes.value = userProfiles.value.map(profile => {
      const behavior = userBehaviors.value.find(b => b.userId === profile.userId)
      return {
        id: profile.userId,
        activityScore: behavior?.activityScore || 0,
        influenceScore: behavior?.influenceScore || 0,
        role: profile.role,
        primaryInterest: profile.interests[0] || 'general',
        size: (behavior?.influenceScore || 0) / 10 + 5 // 节点大小基于影响力
      } as NetworkNode
    })

    // 生成简单的网络边数据（基于共同兴趣）
    networkEdges.value = []
    for (let i = 0; i < userProfiles.value.length; i++) {
      for (let j = i + 1; j < userProfiles.value.length; j++) {
        const user1 = userProfiles.value[i]
        const user2 = userProfiles.value[j]
        
        // 计算共同兴趣
        const commonInterests = user1.interests.filter(interest => 
          user2.interests.includes(interest)
        )
        
        if (commonInterests.length > 0) {
          networkEdges.value.push({
            source: user1.userId,
            target: user2.userId,
            weight: commonInterests.length,
            interactionType: 'follow'
          })
        }
      }
    }

    // 限制边的数量避免过于复杂
    if (networkEdges.value.length > 200) {
      networkEdges.value = networkEdges.value
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 200)
    }
  }

  // 更新聚合统计数据
  function updateAggregatedStats() {
    if (userBehaviors.value.length === 0) {
      aggregatedStats.value = null
      return
    }

    const totalUsers = userBehaviors.value.length
    const activeUsers = userBehaviors.value.filter(b => b.activityScore > 30).length
    const totalPosts = userBehaviors.value.reduce((sum, b) => sum + b.postCount, 0)
    const totalInteractions = userBehaviors.value.reduce((sum, b) => sum + b.interactionCount, 0)
    const avgActivity = userBehaviors.value.reduce((sum, b) => sum + b.activityScore, 0) / totalUsers
    const avgInfluence = userBehaviors.value.reduce((sum, b) => sum + b.influenceScore, 0) / totalUsers

    aggregatedStats.value = {
      totalUsers,
      activeUsers,
      totalPosts,
      totalInteractions,
      avgActivityScore: avgActivity,
      avgInfluenceScore: avgInfluence,
      roleDistribution: getRoleDistribution(),
      interestDistribution: getInterestDistribution()
    }
  }

  // 生成模拟数据（用于演示）
  async function generateMockData(count: number = 100) {
    isLoading.value = true
    
    try {
      const roles: AccountRole[] = ['inactive', 'information-seeker', 'information-source', 'general']
      const interests: AccountInterest[] = [
        'animals', 'arts and culture', 'business and finance', 'entertainment',
        'fashion and beauty', 'fitness and health', 'food and dining',
        'learning and educational', 'politics', 'science and technology',
        'sports', 'travel'
      ]
      const locations = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '重庆']

      // 生成用户配置数据
      userProfiles.value = []
      userBehaviors.value = []
      
      for (let i = 0; i < count; i++) {
        const userId = `user_${i + 1}`
        const role = roles[Math.floor(Math.random() * roles.length)]
        const userInterests = interests
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 4) + 1)
        const location = locations[Math.floor(Math.random() * locations.length)]
        
        // 用户配置
        userProfiles.value.push({
          userId,
          role,
          interests: userInterests,
          registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          location
        })

        // 用户行为数据
        const activityScore = Math.floor(Math.random() * 100)
        const influenceScore = Math.floor(Math.random() * 100)
        const postCount = Math.floor(Math.random() * 1000)
        const interactionCount = Math.floor(Math.random() * 5000)
        
        userBehaviors.value.push({
          userId,
          activityScore,
          influenceScore,
          postCount,
          interactionCount,
          followerCount: Math.floor(Math.random() * 10000),
          followingCount: Math.floor(Math.random() * 1000),
          lastActiveDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // 生成时间序列数据（最近30天）
      timeSeriesData.value = []
      const now = new Date()
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        timeSeriesData.value.push({
          timestamp: date.toISOString(),
          activeUserCount: Math.floor(Math.random() * count * 0.8) + count * 0.1,
          newUserCount: Math.floor(Math.random() * 20),
          postCount: Math.floor(Math.random() * 1000) + 100,
          interactionCount: Math.floor(Math.random() * 5000) + 500,
          avgActivityScore: Math.random() * 100,
          avgInfluenceScore: Math.random() * 100
        })
      }

      // 生成衍生数据
      await generateDerivedData()
      updateAggregatedStats()
      
      lastUpdateTime.value = new Date().toISOString()
      
      addInteractionRecord('filter', 'global', `生成模拟数据: ${count} 个用户`, filterCondition.value)
      
      console.log(`成功生成 ${count} 个用户的模拟数据`)
      
    } catch (error) {
      console.error('生成模拟数据失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 清空所有数据
  function clearAllData() {
    userProfiles.value = []
    userBehaviors.value = []
    timeSeriesData.value = []
    heatmapData.value = []
    scatterData.value = []
    networkNodes.value = []
    networkEdges.value = []
    wordCloudData.value = []
    geographicData.value = []
    aggregatedStats.value = null
    
    resetFilter()
    clearSelection()
    
    addInteractionRecord('filter', 'global', '清空所有数据', filterCondition.value)
  }

  // ===========================================
  // 辅助方法
  // ===========================================
  
  function getRoleDistribution(): Record<AccountRole, number> {
    const distribution: Record<AccountRole, number> = {
      'inactive': 0,
      'information-seeker': 0,
      'information-source': 0,
      'general': 0
    }
    
    filteredUserProfiles.value.forEach(user => {
      distribution[user.role]++
    })
    
    return distribution
  }

  function getInterestDistribution(): Record<AccountInterest, number> {
    const distribution: Record<AccountInterest, number> = {
      'animals': 0,
      'arts and culture': 0,
      'business and finance': 0,
      'entertainment': 0,
      'fashion and beauty': 0,
      'fitness and health': 0,
      'food and dining': 0,
      'learning and educational': 0,
      'politics': 0,
      'science and technology': 0,
      'sports': 0,
      'travel': 0
    }
    
    filteredUserProfiles.value.forEach(user => {
      user.interests.forEach(interest => {
        distribution[interest]++
      })
    })
    
    return distribution
  }

  return {
    // 数据状态
    userProfiles,
    userBehaviors,
    timeSeriesData,
    heatmapData,
    scatterData,
    networkNodes,
    networkEdges,
    wordCloudData,
    geographicData,
    aggregatedStats,
    
    // 筛选和交互状态
    filterCondition,
    selectionState,
    interactionHistory,
    isLoading,
    lastUpdateTime,
    
    // hover和高亮状态
    hoverState,
    highlightState,
    
    // 视图配置
    viewConfigs,
    
    // 计算属性
    filteredUserProfiles,
    filteredUserBehaviors,
    filteredTimeSeriesData,
    visibleViews,
    currentStats,
    
    // 方法
    updateFilter,
    resetFilter,
    updateSelection,
    clearSelection,
    addInteractionRecord,
    revertToHistory,
    updateViewConfig,
    toggleViewVisibility,
    loadData,
    
    // 数据导入和管理方法
    importData,
    generateMockData,
    clearAllData,
    
    // hover状态管理方法
    setHoverState,
    clearHoverState,
    setHighlightState,
    clearHighlightState
  }
}) 