<template>
  <div class="scatter-chart">
    <div class="chart-header">
      <div class="chart-controls">
        <el-radio-group v-model="colorBy" size="small" @change="updateChart">
          <el-radio-button label="role">按角色</el-radio-button>
          <el-radio-button label="interest">按兴趣</el-radio-button>
        </el-radio-group>
        
        <el-select v-model="selectedInterest" placeholder="筛选兴趣" size="small" clearable @change="updateChart">
          <el-option
            v-for="interest in accountInterests"
            :key="interest"
            :label="getInterestName(interest)"
            :value="interest"
          />
        </el-select>
        
        <el-button 
          size="small" 
          :type="brushMode ? 'primary' : ''"
          @click="toggleBrushMode"
        >
          <el-icon><Select /></el-icon>
          框选模式
        </el-button>
      </div>
    </div>

    <div class="chart-container">
      <v-chart 
        ref="chartRef"
        :option="chartOption" 
        :loading="loading"
        autoresize 
        class="chart"
        @click="handleChartClick"
        @brushselected="handleBrushSelected"
        @brushEnd="handleBrushEnd"
      />
    </div>

    <div class="chart-footer" v-if="selectedUsers.length > 0">
      <div class="selection-info">
        <div class="selection-stats">
          已选择 {{ selectedUsers.length }} 个用户
          <span class="stats-detail">
            平均活跃度: {{ avgActivity.toFixed(1) }} | 
            平均影响力: {{ avgInfluence.toFixed(1) }}
          </span>
        </div>
        <div class="selection-actions">
          <el-button size="small" @click="exportSelection">导出选择</el-button>
          <el-button size="small" @click="clearSelection">清除选择</el-button>
        </div>
      </div>
    </div>

    <!-- 用户详情弹出框 -->
    <el-dialog v-model="showUserDetail" title="用户详情" width="500px">
      <div v-if="selectedUserDetail" class="user-detail">
        <div class="detail-row">
          <span class="label">用户ID:</span>
          <span class="value">{{ selectedUserDetail.userId }}</span>
        </div>
        <div class="detail-row">
          <span class="label">角色:</span>
          <span class="value">{{ getRoleName(selectedUserDetail.role) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">兴趣:</span>
          <div class="interests">
            <el-tag 
              v-for="interest in selectedUserDetail.interests" 
              :key="interest"
              :color="interestColorMap[interest]"
              size="small"
            >
              {{ getInterestName(interest) }}
            </el-tag>
          </div>
        </div>
        <div class="detail-row">
          <span class="label">活跃度:</span>
          <span class="value">{{ selectedUserDetail.activityScore.toFixed(1) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">影响力:</span>
          <span class="value">{{ selectedUserDetail.influenceScore.toFixed(1) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">发帖数:</span>
          <span class="value">{{ selectedUserDetail.postCount }}</span>
        </div>
        <div class="detail-row">
          <span class="label">互动数:</span>
          <span class="value">{{ selectedUserDetail.interactionCount }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { ScatterDataPoint, AccountRole, AccountInterest, SelectionState } from '@/models'
import { accountInterests, accountRoles } from '@/models'
import { roleColorMap, interestColorMap, WEIBO_RED, echartsTheme } from '@/util/colors'
import { use } from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BrushComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Select } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 注册ECharts组件
use([
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BrushComponent,
  DataZoomComponent,
  CanvasRenderer
])

interface Props {
  data: ScatterDataPoint[]
  selection?: SelectionState
  loading?: boolean
}

interface Emits {
  (e: 'selectionChange', selection: Partial<SelectionState>): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const chartRef = ref()
const colorBy = ref<'role' | 'interest'>('role')
const selectedInterest = ref<AccountInterest | undefined>()
const brushMode = ref(false)
const selectedUsers = ref<string[]>([])
const showUserDetail = ref(false)
const selectedUserDetail = ref<ScatterDataPoint | null>(null)

// 计算属性
const processedData = computed(() => {
  if (!props.data || props.data.length === 0) {
    return generateMockData()
  }
  
  let filteredData = props.data
  
  // 根据选择的兴趣筛选
  if (selectedInterest.value) {
    filteredData = filteredData.filter(item => 
      item.interests.includes(selectedInterest.value!)
    )
  }
  
  return filteredData
})

const avgActivity = computed(() => {
  if (selectedUsers.value.length === 0) return 0
  const users = processedData.value.filter(u => selectedUsers.value.includes(u.userId))
  return users.reduce((sum, u) => sum + u.activityScore, 0) / users.length
})

const avgInfluence = computed(() => {
  if (selectedUsers.value.length === 0) return 0
  const users = processedData.value.filter(u => selectedUsers.value.includes(u.userId))
  return users.reduce((sum, u) => sum + u.influenceScore, 0) / users.length
})

const chartOption = computed(() => {
  const data = processedData.value
  
  if (data.length === 0) {
    return {
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 16
        }
      }
    }
  }

  // 根据颜色分类处理数据
  const seriesData = colorBy.value === 'role' ? 
    groupByRole(data) : 
    groupByInterest(data)

  return {
    ...echartsTheme,
    title: {
      text: `用户活跃度与影响力分析 (${colorBy.value === 'role' ? '按角色分类' : '按兴趣分类'})`,
      left: 'center',
      textStyle: {
        color: '#1d2129',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const point = params.data
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              用户: ${point.userId}
            </div>
            <div>角色: ${getRoleName(point.role)}</div>
            <div>活跃度: ${point.activityScore.toFixed(1)}</div>
            <div>影响力: ${point.influenceScore.toFixed(1)}</div>
            <div>发帖数: ${point.postCount}</div>
            <div>互动数: ${point.interactionCount}</div>
            <div style="margin-top: 4px;">
              兴趣: ${point.interests.map(getInterestName).join(', ')}
            </div>
          </div>
        `
      }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 10,
      textStyle: {
        color: '#666'
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '20%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '活跃度',
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 100,
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '影响力',
      nameLocation: 'middle',
      nameGap: 50,
      min: 0,
      max: 100,
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    brush: brushMode.value ? {
      toolbox: ['rect', 'polygon', 'clear'],
      brushStyle: {
        borderWidth: 2,
        color: 'rgba(230, 22, 45, 0.1)',
        borderColor: WEIBO_RED
      }
    } : undefined,
    series: seriesData.map(series => ({
      name: series.name,
      type: 'scatter',
      data: series.data.map(item => ({
        value: [item.activityScore, item.influenceScore],
        ...item,
        symbolSize: Math.max(6, Math.min(20, item.influenceScore / 5)) // 根据影响力调整点大小
      })),
      itemStyle: {
        color: series.color,
        opacity: 0.7
      },
      emphasis: {
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          opacity: 1
        }
      }
    }))
  }
})

// 方法
function groupByRole(data: ScatterDataPoint[]) {
  const groups: Record<AccountRole, ScatterDataPoint[]> = {
    'inactive': [],
    'information-seeker': [],
    'information-source': [],
    'general': []
  }
  
  data.forEach(item => {
    groups[item.role].push(item)
  })
  
  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([role, items]) => ({
      name: getRoleName(role as AccountRole),
      data: items,
      color: roleColorMap[role as AccountRole]
    }))
}

function groupByInterest(data: ScatterDataPoint[]) {
  const groups: Record<string, ScatterDataPoint[]> = {}
  
  data.forEach(item => {
    // 取用户的主要兴趣（第一个）
    const primaryInterest = item.interests[0] || 'general'
    if (!groups[primaryInterest]) {
      groups[primaryInterest] = []
    }
    groups[primaryInterest].push(item)
  })
  
  return Object.entries(groups).map(([interest, items]) => ({
    name: getInterestName(interest as AccountInterest),
    data: items,
    color: interestColorMap[interest as AccountInterest] || '#999'
  }))
}

function updateChart() {
  // 图表会自动更新，因为使用了计算属性
  nextTick(() => {
    if (chartRef.value && brushMode.value) {
      // 启用框选模式
      chartRef.value.dispatchAction({
        type: 'takeGlobalCursor',
        key: 'brush',
        brushOption: {
          brushType: 'rect'
        }
      })
    }
  })
}

function toggleBrushMode() {
  brushMode.value = !brushMode.value
  updateChart()
}

function handleChartClick(params: any) {
  if (params.componentType === 'series') {
    const userData = params.data
    selectedUserDetail.value = userData
    showUserDetail.value = true
  }
}

function handleBrushSelected(params: any) {
  if (params.batch && params.batch.length > 0) {
    const selectedIds: string[] = []
    params.batch.forEach((batch: any) => {
      batch.selected.forEach((series: any) => {
        series.dataIndex.forEach((index: number) => {
          const dataPoint = processedData.value[index]
          if (dataPoint) {
            selectedIds.push(dataPoint.userId)
          }
        })
      })
    })
    selectedUsers.value = selectedIds
    
    // 发送选择变更事件
    emit('selectionChange', {
      selectedUserIds: selectedIds
    })
  }
}

function handleBrushEnd() {
  // 框选结束后的处理
}

function clearSelection() {
  selectedUsers.value = []
  
  // 清除图表中的框选
  if (chartRef.value) {
    chartRef.value.dispatchAction({
      type: 'brush',
      areas: []
    })
  }
  
  emit('selectionChange', {
    selectedUserIds: []
  })
}

function exportSelection() {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择用户')
    return
  }
  
  const selectedData = processedData.value.filter(u => selectedUsers.value.includes(u.userId))
  const csvContent = [
    'UserId,Role,ActivityScore,InfluenceScore,PostCount,InteractionCount,Interests',
    ...selectedData.map(u => 
      `${u.userId},${u.role},${u.activityScore},${u.influenceScore},${u.postCount},${u.interactionCount},"${u.interests.join(';')}"`
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `selected_users_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success(`已导出 ${selectedUsers.value.length} 个用户数据`)
}

function getRoleName(role: AccountRole): string {
  const roleNames: Record<AccountRole, string> = {
    'inactive': '非活跃用户',
    'information-seeker': '信息搜索者',
    'information-source': '信息源',
    'general': '一般用户'
  }
  return roleNames[role]
}

function getInterestName(interest: string): string {
  const interestNames: Record<string, string> = {
    'animals': '动物',
    'arts and culture': '艺术文化',
    'business and finance': '商业金融',
    'entertainment': '娱乐',
    'fashion and beauty': '时尚美容',
    'fitness and health': '健身健康',
    'food and dining': '美食餐饮',
    'learning and educational': '学习教育',
    'politics': '政治',
    'science and technology': '科技',
    'sports': '体育',
    'travel': '旅游'
  }
  return interestNames[interest] || interest
}

// 生成模拟数据
function generateMockData(): ScatterDataPoint[] {
  const data: ScatterDataPoint[] = []
  
  for (let i = 0; i < 500; i++) {
    const role = accountRoles[Math.floor(Math.random() * accountRoles.length)]
    const interests = [
      accountInterests[Math.floor(Math.random() * accountInterests.length)]
    ]
    
    // 根据角色生成相应的活跃度和影响力分布
    let activityScore, influenceScore
    switch (role) {
      case 'information-source':
        activityScore = Math.random() * 40 + 60 // 60-100
        influenceScore = Math.random() * 50 + 50 // 50-100
        break
      case 'information-seeker':
        activityScore = Math.random() * 60 + 30 // 30-90
        influenceScore = Math.random() * 40 + 10 // 10-50
        break
      case 'general':
        activityScore = Math.random() * 70 + 20 // 20-90
        influenceScore = Math.random() * 60 + 20 // 20-80
        break
      default: // inactive
        activityScore = Math.random() * 30 // 0-30
        influenceScore = Math.random() * 20 // 0-20
    }
    
    data.push({
      userId: `user_${i + 1}`,
      activityScore,
      influenceScore,
      role,
      interests,
      postCount: Math.floor(Math.random() * 1000),
      interactionCount: Math.floor(Math.random() * 5000)
    })
  }
  
  return data
}

// 监听数据变化
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

watch(() => props.selection, (newSelection) => {
  if (newSelection?.selectedUserIds) {
    selectedUsers.value = newSelection.selectedUserIds
  }
}, { deep: true })

onMounted(() => {
  updateChart()
})
</script>

<style scoped>
.scatter-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.chart-container {
  flex: 1;
  padding: 1rem;
  min-height: 400px;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-footer {
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}

.selection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selection-stats {
  font-size: 0.875rem;
  color: #4e5969;
}

.stats-detail {
  margin-left: 1rem;
  color: #86909c;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
}

/* 用户详情样式 */
.user-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.label {
  font-weight: 600;
  color: #4e5969;
  min-width: 80px;
}

.value {
  color: #1d2129;
}

.interests {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-container {
    padding: 0.5rem;
  }
  
  .selection-info {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .stats-detail {
    margin-left: 0;
    margin-top: 0.25rem;
  }
}
</style> 