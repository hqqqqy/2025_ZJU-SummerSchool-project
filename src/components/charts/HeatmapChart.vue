<template>
  <div class="heatmap-chart">
    <div class="chart-header">
      <div class="chart-controls">
        <el-radio-group v-model="selectedMetric" size="small" @change="updateChart">
          <el-radio-button label="value">活跃度</el-radio-button>
          <el-radio-button label="userCount">用户数</el-radio-button>
          <el-radio-button label="postCount">发帖数</el-radio-button>
        </el-radio-group>
        
        <el-select v-model="colorScheme" size="small" style="width: 120px" @change="updateChart">
          <el-option label="经典配色" value="classic" />
          <el-option label="现代配色" value="modern" />
          <el-option label="温和配色" value="gentle" />
          <el-option label="单色配色" value="monochrome" />
        </el-select>
        
        <el-select v-model="viewMode" size="small" style="width: 120px" @change="updateChart">
          <el-option label="标准视图" value="standard" />
          <el-option label="紧凑视图" value="compact" />
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
      />
    </div>

    <div class="chart-footer">
      <div class="legend-info">
        <div class="metric-info">
          <span class="metric-label">{{ getMetricName(selectedMetric) }}:</span>
          <span class="metric-range">
            最小值: {{ minValue.toFixed(1) }} | 
            最大值: {{ maxValue.toFixed(1) }} | 
            平均值: {{ avgValue.toFixed(1) }}
          </span>
        </div>
        <div class="time-insights" v-if="peakTimeInsights">
          <span class="insights-label">活跃高峰:</span>
          <span class="insights-content">{{ peakTimeInsights }}</span>
        </div>
      </div>
    </div>

    <!-- 时段详情弹窗 -->
    <el-dialog v-model="showTimeDetail" title="时段详情" width="400px">
      <div v-if="selectedTimeData" class="time-detail">
        <div class="detail-header">
          <h4>{{ formatTimeSlot(selectedTimeData.hour, selectedTimeData.dayOfWeek) }}</h4>
        </div>
        <div class="detail-metrics">
          <div class="metric-item">
            <span class="metric-name">活跃度值</span>
            <span class="metric-value">{{ selectedTimeData.value.toFixed(1) }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-name">活跃用户数</span>
            <span class="metric-value">{{ selectedTimeData.userCount }}</span>
          </div>
          <div class="metric-item">
            <span class="metric-name">发帖数</span>
            <span class="metric-value">{{ selectedTimeData.postCount }}</span>
          </div>
        </div>
        <div class="detail-insights">
          <div class="insight-item">
            <span class="insight-label">相对活跃程度:</span>
            <span class="insight-value">{{ getActivityLevel(selectedTimeData.value) }}</span>
          </div>
          <div class="insight-item">
            <span class="insight-label">推荐发帖时机:</span>
            <span class="insight-value">{{ getRecommendation(selectedTimeData.value) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores'
import type { HeatmapDataPoint } from '@/models'
import { WEIBO_RED, heatmapColors, heatmapColorSchemes, echartsTheme } from '@/util/colors'
import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册ECharts组件
use([
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  CalendarComponent,
  CanvasRenderer
])

interface Props {
  data: HeatmapDataPoint[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// store
const analysisStore = useAnalysisStore()
const { hoverState } = storeToRefs(analysisStore)

// 响应式数据
const selectedMetric = ref<'value' | 'userCount' | 'postCount'>('value')
const colorScheme = ref<'classic' | 'modern' | 'gentle' | 'monochrome'>('classic')
const viewMode = ref<'standard' | 'compact'>('standard')
const showTimeDetail = ref(false)
const selectedTimeData = ref<HeatmapDataPoint | null>(null)

// 星期和小时标签
const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

// 计算属性
const processedData = computed(() => {
  // 优先使用传入的真实数据
  if (props.data && props.data.length > 0) {
    console.log('热力图使用真实数据:', props.data.length, '个数据点')
    return props.data
  }
  
  // 如果没有数据则使用模拟数据
  console.log('热力图使用模拟数据')
    return generateMockData()
})

const chartData = computed(() => {
  return processedData.value.map(item => [
    item.hour,
    item.dayOfWeek,
    getMetricValue(item, selectedMetric.value)
  ])
})

const minValue = computed(() => {
  const values = processedData.value.map(item => getMetricValue(item, selectedMetric.value))
  if (values.length === 0) return 0
  const validValues = values.filter(val => !isNaN(val) && isFinite(val))
  return validValues.length > 0 ? Math.min(...validValues) : 0
})

const maxValue = computed(() => {
  const values = processedData.value.map(item => getMetricValue(item, selectedMetric.value))
  if (values.length === 0) return 100
  const validValues = values.filter(val => !isNaN(val) && isFinite(val))
  return validValues.length > 0 ? Math.max(...validValues) : 100
})

const avgValue = computed(() => {
  const values = processedData.value.map(item => getMetricValue(item, selectedMetric.value))
  if (values.length === 0) return 0
  const sum = values.reduce((sum, val) => sum + (isNaN(val) ? 0 : val), 0)
  return sum / values.length
})

const peakTimeInsights = computed(() => {
  if (processedData.value.length === 0) return ''
  
  // 找到活跃度最高的时段
  let maxData = processedData.value[0]
  processedData.value.forEach(item => {
    if (item.value > maxData.value) {
      maxData = item
    }
  })
  
  return `${dayLabels[maxData.dayOfWeek]} ${hourLabels[maxData.hour]} (活跃度: ${maxData.value.toFixed(1)})`
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

  return {
    ...echartsTheme,
    title: {
      text: selectedMetric.value === 'value' ? '用户活跃度热力图' : `用户活跃度热力图 - ${getMetricName(selectedMetric.value)}`,
      left: 'center',
      textStyle: {
        color: '#1d2129',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const [hour, dayOfWeek, value] = params.data
        const timeData = processedData.value.find(
          item => item.hour === hour && item.dayOfWeek === dayOfWeek
        )
        
        if (!timeData) return ''
        
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${dayLabels[dayOfWeek]} ${hourLabels[hour]}
            </div>
            <div>活跃度: ${timeData.value.toFixed(1)}</div>
            <div>活跃用户数: ${timeData.userCount}</div>
            <div>发帖数: ${timeData.postCount}</div>
          </div>
        `
      }
    },
    grid: {
      height: viewMode.value === 'compact' ? '60%' : '70%',
      top: '15%',
      left: '10%',
      right: '20%'
    },
    xAxis: {
      type: 'category',
      data: hourLabels,
      splitArea: {
        show: true
      },
      axisLabel: {
        interval: viewMode.value === 'compact' ? 3 : 1, // 紧凑模式下间隔显示
        rotate: viewMode.value === 'compact' ? 45 : 0,
        color: '#666'
      },
      name: '小时',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'category',
      data: dayLabels,
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#666'
      },
      name: '星期',
      nameLocation: 'middle',
      nameGap: 50
    },
    visualMap: {
      min: minValue.value,
      max: maxValue.value,
      calculable: true,
      orient: 'vertical',
      right: '10%',
      top: '15%',
      inRange: {
        color: getCurrentColorScheme()
      },
      textStyle: {
        color: '#666'
      },
      formatter: (value: number) => {
        return value.toFixed(1)
      }
    },
    series: [{
      name: getMetricName(selectedMetric.value),
      type: 'heatmap',
      data: data,
      label: {
        show: viewMode.value === 'standard',
        formatter: (params: any) => {
          return params.data[2].toFixed(0)
        },
        color: '#fff',
        fontSize: 10
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
})

// 方法
function getCurrentColorScheme(): string[] {
  const schemes = heatmapColorSchemes[colorScheme.value]
  switch (colorScheme.value) {
    case 'classic':
      return [
        schemes.low,     // 深绿色
        '#4CAF50',       // 中绿色
        '#8BC34A',       // 浅绿色
        '#CDDC39',       // 黄绿色
        '#FFEB3B',       // 黄色
        '#FFC107',       // 金色
        schemes.medium,  // 琥珀色
        '#FF5722',       // 深橙色
        schemes.high     // 深红色
      ]
    case 'modern':
      return [
        schemes.low,     // 蓝色
        '#1976D2',       // 中蓝色
        '#512DA8',       // 紫色
        '#7B1FA2',       // 中紫色
        '#8E24AA',       // 深紫色
        '#AD1457',       // 玫红色
        schemes.medium,  // 深紫红色
        '#C2185B',       // 粉红色
        schemes.high     // 深粉色
      ]
    case 'gentle':
      return [
        schemes.low,     // 青色
        '#26C6DA',       // 浅青色
        '#29B6F6',       // 淡蓝色
        '#42A5F5',       // 蓝色
        schemes.medium,  // 中蓝色
        '#5C6BC0',       // 靛蓝色
        '#7986CB',       // 浅紫色
        schemes.high     // 深紫色
      ]
    case 'monochrome':
      return [
        schemes.low,     // 极浅红色
        '#FFCDD2',       // 浅红色
        '#EF9A9A',       // 淡红色
        schemes.medium,  // 中红色
        '#EF5350',       // 较深红色
        '#E53935',       // 深红色
        schemes.high     // 极深红色
      ]
    default:
      return [schemes.low, schemes.medium, schemes.high]
  }
}

function updateChart() {
  // 图表会自动更新，因为使用了计算属性
}

function handleChartClick(params: any) {
  if (params.componentType === 'series') {
    const [hour, dayOfWeek] = params.data
    const timeData = processedData.value.find(
      item => item.hour === hour && item.dayOfWeek === dayOfWeek
    )
    
    if (timeData) {
      selectedTimeData.value = timeData
      showTimeDetail.value = true
    }
  }
}

function getMetricValue(item: HeatmapDataPoint, metric: string): number {
  let value: number
  switch (metric) {
    case 'value':
      value = item.value
      break
    case 'userCount':
      value = item.userCount
      break
    case 'postCount':
      value = item.postCount
      break
    default:
      value = item.value
  }
  
  // 确保返回有效数字
  return isNaN(value) || !isFinite(value) ? 0 : value
}

function getMetricName(metric: string): string {
  const names: Record<string, string> = {
    value: '活跃度值',
    userCount: '活跃用户数',
    postCount: '发帖数'
  }
  return names[metric] || metric
}

function formatTimeSlot(hour: number, dayOfWeek: number): string {
  return `${dayLabels[dayOfWeek]} ${hourLabels[hour]}`
}

function getActivityLevel(value: number): string {
  const maxVal = maxValue.value
  const ratio = value / maxVal
  
  if (ratio >= 0.8) return '非常活跃'
  if (ratio >= 0.6) return '较为活跃'
  if (ratio >= 0.4) return '中等活跃'
  if (ratio >= 0.2) return '较少活跃'
  return '不活跃'
}

function getRecommendation(value: number): string {
  const maxVal = maxValue.value
  const ratio = value / maxVal
  
  if (ratio >= 0.8) return '最佳发帖时机'
  if (ratio >= 0.6) return '适合发帖'
  if (ratio >= 0.4) return '一般时机'
  if (ratio >= 0.2) return '不太推荐'
  return '避免此时段'
}

// 生成模拟数据
function generateMockData(): HeatmapDataPoint[] {
  const data: HeatmapDataPoint[] = []
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // 模拟真实的活跃度模式
      let baseValue = 30 // 提高基础值，确保有明显的热力图效果
      
      // 工作日vs周末模式
      if (day >= 1 && day <= 5) { // 工作日 (周一到周五)
        if (hour >= 8 && hour <= 10) baseValue += 40 // 上班通勤高峰
        if (hour >= 12 && hour <= 14) baseValue += 35 // 午休时间
        if (hour >= 18 && hour <= 22) baseValue += 50 // 下班后高峰
        if (hour >= 0 && hour <= 6) baseValue *= 0.2 // 深夜很低
        if (hour >= 7 && hour <= 8) baseValue += 15 // 早上起床
      } else { // 周末
        if (hour >= 9 && hour <= 11) baseValue += 25 // 周末上午
        if (hour >= 14 && hour <= 17) baseValue += 20 // 周末下午
        if (hour >= 19 && hour <= 23) baseValue += 45 // 周末晚上
        if (hour >= 0 && hour <= 8) baseValue *= 0.3 // 周末睡懒觉
      }
      
      // 添加随机变化，保持数据的自然性
      const variance = (Math.random() - 0.5) * 25
      const value = Math.max(5, baseValue + variance) // 确保最小值为5
      
      data.push({
        hour,
        dayOfWeek: day,
        value,
        userCount: Math.floor(value * 8 + Math.random() * 100 + 50), // 确保有合理的用户数
        postCount: Math.floor(value * 15 + Math.random() * 200 + 100) // 确保有合理的发帖数
      })
    }
  }
  
  return data
}

// 监听数据变化
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

watch(colorScheme, () => {
  updateChart()
})

onMounted(() => {
  updateChart()
})
</script>

<style scoped>
.heatmap-chart {
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
  justify-content: flex-end;
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

.legend-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-info, .time-insights {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.metric-label, .insights-label {
  font-weight: 600;
  color: #4e5969;
}

.metric-range, .insights-content {
  color: #86909c;
}

/* 时段详情样式 */
.time-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header h4 {
  margin: 0;
  color: #1d2129;
  font-size: 1.2rem;
  text-align: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.metric-name {
  font-weight: 500;
  color: #4e5969;
}

.metric-value {
  font-weight: 600;
  color: #E6162D;
  font-size: 1.1rem;
}

.detail-insights {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff7f7;
  border-radius: 8px;
  border-left: 4px solid #E6162D;
}

.insight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.insight-label {
  color: #4e5969;
  font-size: 0.9rem;
}

.insight-value {
  color: #1d2129;
  font-weight: 500;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .chart-container {
    padding: 0.5rem;
  }
  
  .legend-info {
    gap: 0.75rem;
  }
  
  .metric-info, .time-insights {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .detail-insights {
    padding: 0.75rem;
  }
  
  .insight-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style> 