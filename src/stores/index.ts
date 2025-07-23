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

// ============== 新增导入 ==============
import { processCSVData } from '@/util/dataLoader'

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

  const visibleViews = computed(() => {
    return Object.values(viewConfigs.value).filter(config => config.isVisible)
  })

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
  
  function updateFilter(newFilter: Partial<FilterCondition>) {
    filterCondition.value = { ...filterCondition.value, ...newFilter }
    addInteractionRecord('filter', 'global', '更新筛选条件', newFilter)
  }

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

  function updateSelection(newSelection: Partial<SelectionState>) {
    selectionState.value = { ...selectionState.value, ...newSelection }
    addInteractionRecord('select', 'global', '更新选择状态', undefined, newSelection)
  }

  function clearSelection() {
    selectionState.value = {
      selectedUserIds: [],
      selectedRole: undefined,
      selectedInterest: undefined,
      selectedRegion: undefined,
      selectedTimeRange: undefined
    }
  }

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

  function updateViewConfig(viewType: ViewType, config: Partial<ViewConfig>) {
    viewConfigs.value[viewType] = { ...viewConfigs.value[viewType], ...config }
  }

  function toggleViewVisibility(viewType: ViewType) {
    viewConfigs.value[viewType].isVisible = !viewConfigs.value[viewType].isVisible
  }

  // ============== 新增方法 ==============
  async function loadCSVData(csvData: string) {
    isLoading.value = true
    try {
      const {
        userProfiles: profiles,
        userBehaviors: behaviors,
        timeSeriesData: tsData,
        heatmapData: hmData,
        scatterData: scData
      } = processCSVData(csvData)

      // 更新核心数据
      userProfiles.value = profiles
      userBehaviors.value = behaviors
      timeSeriesData.value = tsData
      heatmapData.value = hmData
      scatterData.value = scData

      // 生成网络数据
      networkNodes.value = profiles.map(profile => ({
        id: profile.userId,
        activityScore: behaviors.find(b => b.userId === profile.userId)!.activityScore,
        influenceScore: behaviors.find(b => b.userId === profile.userId)!.influenceScore,
        role: profile.role,
        primaryInterest: profile.interests[0] || 'general',
        size: behaviors.find(b => b.userId === profile.userId)!.influenceScore / 10
      }))

      lastUpdateTime.value = new Date().toISOString()
    } catch (error) {
      console.error('CSV处理失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadMockData() {
    if (!import.meta.env.DEV) return
    await loadCSVData(`user_id,registration_date,location,last_active_date,role,interests,post_count,interactions,follower_count
user1,2023-01-01,北京,2023-06-20,general,"technology,sports",120,680,5000
user2,2022-11-03,上海,2023-06-18,information-source,"entertainment,fashion",350,1750,15000`)
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
    // ============== 新增导出 ==============
    loadCSVData,
    loadMockData
  }
})
