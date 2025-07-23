<template>
  <div class="pie-chart">
    <div class="chart-header">
      <div class="chart-controls">
        <el-select v-model="chartStyle" size="small" style="width: 120px" @change="updateChart">
          <el-option label="环形图" value="doughnut" />
          <el-option label="饼图" value="pie" />
          <el-option label="玫瑰图" value="rose" />
        </el-select>
      </div>
    </div>

    <div class="chart-container">
      <v-chart 
        :option="chartOption" 
        :loading="loading"
        autoresize 
        class="chart"
        @click="handleChartClick"
        @mouseover="handleChartHover"
        @mouseout="handleChartLeave"
      />
    </div>

    <div class="chart-footer">
      <div class="statistics-summary">
        <div class="summary-item">
          <span class="summary-label">总分类数:</span>
          <span class="summary-value">{{ totalCategories }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">最大占比:</span>
          <span class="summary-value">{{ maxPercentage.toFixed(1) }}%</span>
        </div>
        <div class="summary-item" v-if="selectedCategory">
          <span class="summary-label">已选择:</span>
          <span class="summary-value">{{ selectedCategory }}</span>
        </div>
      </div>
    </div>

    <!-- 详细数据表格 -->
    <el-dialog v-model="showDetailTable" title="详细数据" width="600px">
      <el-table :data="tableData" stripe>
        <el-table-column prop="name" label="分类" />
        <el-table-column prop="count" label="数量" />
        <el-table-column prop="percentage" label="占比" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button 
              size="small" 
              @click="selectCategory(scope.row.key)"
              :type="scope.row.key === selectedCategory ? 'primary' : ''"
            >
              {{ scope.row.key === selectedCategory ? '取消选择' : '选择' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores'
import type { AccountRole, AccountInterest, SelectionState } from '@/models'
import { accountRoles, accountInterests } from '@/models'
import { roleColorMap, interestColorMap, WEIBO_RED, echartsTheme } from '@/util/colors'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册ECharts组件
use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

interface Props {
  roleDistribution?: Record<AccountRole, number>
  interestDistribution?: Record<AccountInterest, number>
  selection?: SelectionState
  loading?: boolean
}

interface Emits {
  (e: 'selectionChange', selection: Partial<SelectionState>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// store
const analysisStore = useAnalysisStore()
const { filterCondition, hoverState } = storeToRefs(analysisStore)

// 响应式数据
const chartStyle = ref<'doughnut' | 'pie' | 'rose'>('doughnut')
const selectedCategory = ref<string | null>(null)
const showDetailTable = ref(false)

// 计算属性
const chartType = computed(() => {
  // 根据筛选面板的选择决定显示什么
  // 如果有角色筛选，优先显示角色分布
  if (filterCondition.value.roles && filterCondition.value.roles.length > 0) {
    return 'role'
  }
  // 如果有兴趣筛选，显示兴趣分布
  if (filterCondition.value.interests && filterCondition.value.interests.length > 0) {
    return 'interest'
  }
  // 默认显示角色分布
  return 'role'
})

const currentDistribution = computed(() => {
  if (chartType.value === 'role') {
    return props.roleDistribution || generateMockRoleData()
  } else {
    return props.interestDistribution || generateMockInterestData()
  }
})

const chartData = computed(() => {
  const distribution = currentDistribution.value
  const colorMap = chartType.value === 'role' ? roleColorMap : interestColorMap
  
  return Object.entries(distribution)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: getName(key),
      value,
      key,
      itemStyle: {
        color: colorMap[key as keyof typeof colorMap] || '#999'
      }
    }))
    .sort((a, b) => b.value - a.value)
})

const totalCount = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.value, 0)
})

const totalCategories = computed(() => {
  return chartData.value.length
})

const maxPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  const maxValue = Math.max(...chartData.value.map(item => item.value))
  return (maxValue / totalCount.value) * 100
})

const tableData = computed(() => {
  return chartData.value.map(item => ({
    name: item.name,
    key: item.key,
    count: item.value,
    percentage: `${((item.value / totalCount.value) * 100).toFixed(1)}%`
  }))
})

const chartOption = computed(() => {
  const data = chartData.value
  
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

  const radius = chartStyle.value === 'doughnut' ? ['40%', '70%'] : 
                 chartStyle.value === 'pie' ? '60%' : 
                 ['20%', '80%']

  return {
    ...echartsTheme,
    title: {
      text: `${chartType.value === 'role' ? '用户角色' : '兴趣分类'}分布`,
      left: 'center',
      top: '5%',
      textStyle: {
        color: '#1d2129',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const percentage = ((params.value / totalCount.value) * 100).toFixed(1)
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${params.name}
            </div>
            <div>数量: ${params.value}</div>
            <div>占比: ${percentage}%</div>
          </div>
        `
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: '2%',
      top: 'center',
      textStyle: {
        color: '#666'
      },
      formatter: (name: string) => {
        const item = data.find(d => d.name === name)
        if (!item) return name
        const percentage = ((item.value / totalCount.value) * 100).toFixed(1)
        return `${name} (${percentage}%)`
      }
    },
    series: [
      {
        name: chartType.value === 'role' ? '用户角色' : '兴趣分类',
        type: 'pie',
        radius,
        center: ['35%', '50%'],
        roseType: chartStyle.value === 'rose' ? 'radius' : false,
        data: data.map(item => {
          // 检查是否需要高亮此项
          const shouldHighlight = chartType.value === 'role' 
            ? hoverState.value.hoveredRole === item.key
            : hoverState.value.hoveredInterest === item.key
          
          const hasHover = hoverState.value.hoveredRole || hoverState.value.hoveredInterest
          
          return {
          ...item,
          selected: item.key === selectedCategory.value,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
            itemStyle: {
              ...item.itemStyle,
              opacity: shouldHighlight || !hasHover ? 1 : 0.3,
              borderWidth: shouldHighlight ? 3 : 2,
              borderColor: shouldHighlight ? '#fff' : '#fff'
            }
          }
        }),
          label: {
            show: chartStyle.value !== 'doughnut',
            position: chartStyle.value === 'rose' ? 'inside' : 'outside',
            formatter: (params: any) => {
              const percentage = ((params.value / totalCount.value) * 100).toFixed(1)
              return chartStyle.value === 'rose' ? 
                `${percentage}%` : 
                `${params.name}\n${percentage}%`
            }
          },
          labelLine: {
            show: chartStyle.value === 'pie'
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => Math.random() * 200
      }
    ]
  }
})

// 方法
function updateChart() {
  // 图表会自动更新，因为使用了计算属性
}

function handleChartClick(params: any) {
  if (params.componentType === 'series') {
    const clickedKey = params.data.key
    
    if (selectedCategory.value === clickedKey) {
      // 取消选择
      selectedCategory.value = null
    } else {
      // 选择新的分类
      selectedCategory.value = clickedKey
    }
    
    updateSelection()
  }
}

function handleChartHover(params: any) {
  if (params.componentType === 'series') {
    const hoveredKey = params.data.key
    
    // 设置hover状态，触发其他图表联动
    if (chartType.value === 'role') {
      analysisStore.setHoverState({
        hoveredRole: hoveredKey as AccountRole,
        sourceChart: 'pieChart'
      })
    } else {
      analysisStore.setHoverState({
        hoveredInterest: hoveredKey as AccountInterest,
        sourceChart: 'pieChart'
      })
    }
  }
}

function handleChartLeave() {
  // 清除hover状态
  analysisStore.clearHoverState()
}

function selectCategory(key: string) {
  if (selectedCategory.value === key) {
    selectedCategory.value = null
  } else {
    selectedCategory.value = key
  }
  updateSelection()
}

function updateSelection() {
  if (chartType.value === 'role') {
    emit('selectionChange', {
      selectedRole: selectedCategory.value as AccountRole || undefined
    })
  } else {
    emit('selectionChange', {
      selectedInterest: selectedCategory.value as AccountInterest || undefined
    })
  }
}

function getName(key: string): string {
  if (chartType.value === 'role') {
    const roleNames: Record<string, string> = {
      'inactive': '非活跃用户',
      'information-seeker': '信息搜索者',
      'information-source': '信息源',
      'general': '一般用户'
    }
    return roleNames[key] || key
  } else {
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
    return interestNames[key] || key
  }
}

// 生成模拟数据
function generateMockRoleData(): Record<AccountRole, number> {
  return {
    'general': Math.floor(Math.random() * 1000) + 500,
    'information-seeker': Math.floor(Math.random() * 800) + 300,
    'information-source': Math.floor(Math.random() * 300) + 100,
    'inactive': Math.floor(Math.random() * 600) + 200
  }
}

function generateMockInterestData(): Record<AccountInterest, number> {
  const data: Record<AccountInterest, number> = {} as any
  
  accountInterests.forEach(interest => {
    data[interest] = Math.floor(Math.random() * 500) + 50
  })
  
  return data
}

// 监听外部选择变化
watch(() => props.selection, (newSelection) => {
  if (newSelection) {
    if (chartType.value === 'role' && newSelection.selectedRole) {
      selectedCategory.value = newSelection.selectedRole
    } else if (chartType.value === 'interest' && newSelection.selectedInterest) {
      selectedCategory.value = newSelection.selectedInterest
    }
  }
}, { deep: true })

onMounted(() => {
  updateChart()
})
</script>

<style scoped>
.pie-chart {
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
}

.chart-container {
  flex: 1;
  padding: 1rem;
  min-height: 350px;
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

.statistics-summary {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.875rem;
  color: #86909c;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #E6162D;
}

/* 详细表格样式 */
:deep(.el-table) {
  font-size: 0.9rem;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .chart-container {
    padding: 0.5rem;
    min-height: 300px;
  }
  
  .statistics-summary {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .summary-item {
    flex-direction: row;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .chart-container {
    min-height: 280px;
  }
}
</style> 