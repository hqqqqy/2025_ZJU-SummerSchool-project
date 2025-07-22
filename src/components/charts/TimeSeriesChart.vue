<template>
  <div class="time-series-chart">
    <div class="chart-header">
      <div class="chart-controls">
        <el-radio-group v-model="selectedMetrics" size="small" @change="updateChart">
          <el-radio-button label="activeUsers">活跃用户</el-radio-button>
          <el-radio-button label="newUsers">新增用户</el-radio-button>
          <el-radio-button label="posts">发帖数</el-radio-button>
          <el-radio-button label="interactions">互动数</el-radio-button>
        </el-radio-group>
        
        <el-select v-model="aggregationLevel" size="small" style="width: 100px" @change="updateChart">
          <el-option label="小时" value="hour" />
          <el-option label="天" value="day" />
          <el-option label="周" value="week" />
          <el-option label="月" value="month" />
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
        @brush="handleBrushSelect"
      />
    </div>

    <div class="chart-footer" v-if="selectedRange">
      <div class="selected-info">
        已选择时间范围: {{ formatDate(selectedRange.start) }} 至 {{ formatDate(selectedRange.end) }}
        <el-button size="small" text @click="clearSelection">清除选择</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { TimeSeriesDataPoint } from '@/models'
import { timeSeriesColors, WEIBO_RED, echartsTheme } from '@/util/colors'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册ECharts组件
use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  BrushComponent,
  ToolboxComponent,
  CanvasRenderer
])

interface Props {
  data: TimeSeriesDataPoint[]
  loading?: boolean
  height?: string
}

interface Emits {
  (e: 'timeRangeSelect', range: { start: string; end: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  height: '400px'
})

const emit = defineEmits<Emits>()

// 响应式数据
const selectedMetrics = ref<string>('activeUsers')
const aggregationLevel = ref<string>('day')
const selectedRange = ref<{ start: string; end: string } | null>(null)

// 计算属性
const processedData = computed(() => {
  if (!props.data || props.data.length === 0) {
    return generateMockData()
  }
  
  // 根据聚合级别处理数据
  return aggregateData(props.data, aggregationLevel.value)
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

  const xAxisData = data.map(item => item.timestamp)
  
  return {
    ...echartsTheme,
    title: {
      text: getMetricName(selectedMetrics.value) + '趋势分析',
      left: 'center',
      textStyle: {
        color: '#1d2129',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: WEIBO_RED
        }
      },
      formatter: (params: any) => {
        const point = params[0]
        const dataPoint = data[point.dataIndex]
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${formatDate(dataPoint.timestamp)}
            </div>
            <div style="color: ${WEIBO_RED};">
              ${getMetricName(selectedMetrics.value)}: ${formatValue(point.value)}
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">
              活跃用户: ${dataPoint.activeUserCount}<br/>
              新增用户: ${dataPoint.newUserCount}<br/>
              发帖数: ${dataPoint.postCount}<br/>
              互动数: ${dataPoint.interactionCount}
            </div>
          </div>
        `
      }
    },
    legend: {
      show: false
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: {
        lineStyle: {
          color: '#d9d9d9'
        }
      },
      axisLabel: {
        formatter: (value: string) => formatAxisDate(value, aggregationLevel.value),
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        formatter: (value: number) => formatValue(value),
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 30,
        bottom: 0,
        textStyle: {
          color: '#666'
        },
        borderColor: '#d9d9d9',
        fillerColor: 'rgba(230, 22, 45, 0.1)',
        handleStyle: {
          color: WEIBO_RED
        }
      }
    ],
    brush: {
      toolbox: ['lineX'],
      brushStyle: {
        borderWidth: 2,
        color: 'rgba(230, 22, 45, 0.1)',
        borderColor: WEIBO_RED
      }
    },
    series: [
      {
        name: getMetricName(selectedMetrics.value),
        type: 'line',
        data: data.map(item => getMetricValue(item, selectedMetrics.value)),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          color: timeSeriesColors[selectedMetrics.value as keyof typeof timeSeriesColors] || WEIBO_RED,
          width: 2
        },
        itemStyle: {
          color: timeSeriesColors[selectedMetrics.value as keyof typeof timeSeriesColors] || WEIBO_RED
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: timeSeriesColors[selectedMetrics.value as keyof typeof timeSeriesColors] || WEIBO_RED + '40'
              },
              {
                offset: 1,
                color: timeSeriesColors[selectedMetrics.value as keyof typeof timeSeriesColors] || WEIBO_RED + '00'
              }
            ]
          }
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2
          }
        }
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
    const dataPoint = processedData.value[params.dataIndex]
    if (dataPoint) {
      // 可以在这里处理点击事件
      console.log('Clicked data point:', dataPoint)
    }
  }
}

function handleBrushSelect(params: any) {
  if (params.areas && params.areas.length > 0) {
    const area = params.areas[0]
    const startIndex = Math.floor(area.coordRange[0])
    const endIndex = Math.ceil(area.coordRange[1])
    
    const data = processedData.value
    if (startIndex >= 0 && endIndex < data.length) {
      const range = {
        start: data[startIndex].timestamp,
        end: data[endIndex].timestamp
      }
      selectedRange.value = range
      emit('timeRangeSelect', range)
    }
  }
}

function clearSelection() {
  selectedRange.value = null
  // 这里可以触发清除选择的事件
}

function getMetricName(metric: string): string {
  const names: Record<string, string> = {
    activeUsers: '活跃用户数',
    newUsers: '新增用户数',
    posts: '发帖数',
    interactions: '互动数',
    activity: '平均活跃度',
    influence: '平均影响力'
  }
  return names[metric] || metric
}

function getMetricValue(dataPoint: TimeSeriesDataPoint, metric: string): number {
  switch (metric) {
    case 'activeUsers':
      return dataPoint.activeUserCount
    case 'newUsers':
      return dataPoint.newUserCount
    case 'posts':
      return dataPoint.postCount
    case 'interactions':
      return dataPoint.interactionCount
    case 'activity':
      return dataPoint.avgActivityScore
    case 'influence':
      return dataPoint.avgInfluenceScore
    default:
      return 0
  }
}

function formatValue(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toString()
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: aggregationLevel.value === 'hour' ? 'numeric' : undefined
  })
}

function formatAxisDate(timestamp: string, level: string): string {
  const date = new Date(timestamp)
  switch (level) {
    case 'hour':
      return date.getHours() + ':00'
    case 'day':
      return `${date.getMonth() + 1}/${date.getDate()}`
    case 'week':
      return `${date.getMonth() + 1}/${date.getDate()}`
    case 'month':
      return `${date.getFullYear()}/${date.getMonth() + 1}`
    default:
      return timestamp
  }
}

function aggregateData(data: TimeSeriesDataPoint[], level: string): TimeSeriesDataPoint[] {
  // 这里应该根据聚合级别处理数据
  // 为了演示，直接返回原数据
  return data.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

// 生成模拟数据用于演示
function generateMockData(): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = []
  const now = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString()
    data.push({
      timestamp,
      activeUserCount: Math.floor(Math.random() * 5000) + 1000,
      newUserCount: Math.floor(Math.random() * 500) + 50,
      postCount: Math.floor(Math.random() * 10000) + 2000,
      interactionCount: Math.floor(Math.random() * 50000) + 10000,
      avgActivityScore: Math.random() * 100,
      avgInfluenceScore: Math.random() * 100
    })
  }
  
  return data
}

// 监听数据变化
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  updateChart()
})
</script>

<style scoped>
.time-series-chart {
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
  min-height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-footer {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}

.selected-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #4e5969;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .chart-container {
    padding: 0.5rem;
  }
}
</style> 