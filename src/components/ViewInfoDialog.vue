<template>
  <el-dialog 
    v-model="dialogVisible" 
    :title="dialogTitle"
    width="500px"
    @close="handleClose"
  >
    <div class="view-info-content">
      <div class="info-section">
        <h4>{{ viewDetails.title }}</h4>
        <p>{{ viewDetails.description }}</p>
      </div>
      
      <div class="info-section">
        <h4>主要功能</h4>
        <ul>
          <li v-for="feature in viewDetails.features" :key="feature">
            {{ feature }}
          </li>
        </ul>
      </div>
      
      <div class="info-section">
        <h4>交互操作</h4>
        <ul>
          <li v-for="interaction in viewDetails.interactions" :key="interaction">
            {{ interaction }}
          </li>
        </ul>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ViewType } from '@/models'

interface Props {
  visible: boolean
  viewType: ViewType
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const dialogTitle = computed(() => {
  return `${viewDetails.value.title} - 使用说明`
})

const viewDetails = computed(() => {
  const details = {
    timeSeries: {
      title: '时间序列分析',
      description: '展示用户活跃度、发帖数、互动数等指标随时间变化的趋势，帮助识别用户行为模式和增长趋势。',
      features: [
        '多指标切换：活跃用户数、新增用户数、发帖数、互动数',
        '时间粒度：支持小时、天、周、月级别数据聚合',
        '趋势分析：自动识别增长趋势和异常波动',
        '数据缩放：支持时间轴缩放和平移'
      ],
      interactions: [
        '悬停查看具体数值和时间点详情',
        '拖拽选择时间范围进行深入分析',
        '使用底部滑块快速调整时间窗口',
        '点击图例切换显示不同指标'
      ]
    },
    scatter: {
      title: '散点图分析',
      description: '以活跃度为X轴、影响力为Y轴，展示用户在这两个维度上的分布，支持按角色或兴趣分类着色。',
      features: [
        '双维度展示：活跃度 vs 影响力',
        '分类着色：按用户角色或兴趣分类',
        '框选功能：支持矩形、多边形框选',
        '数据导出：选中用户可导出CSV格式'
      ],
      interactions: [
        '点击数据点查看用户详细信息',
        '启用框选模式圈选用户群体',
        '切换颜色分类查看不同维度',
        '导出选中用户的详细数据'
      ]
    },
    heatmap: {
      title: '活跃度热力图',
      description: '以24小时×7天的热力图形式展示用户活跃度分布模式，帮助识别最佳内容发布时机。',
      features: [
        '时间模式：24小时×7天的活跃度分布',
        '多指标：活跃度值、用户数量、发帖数量',
        '颜色映射：深浅不同代表活跃程度',
        '时段洞察：显示峰值时段和推荐发布时机'
      ],
      interactions: [
        '点击时段查看具体数据详情',
        '悬停显示该时段的活跃统计',
        '切换不同指标的热力图显示',
        '识别最佳内容发布时间窗口'
      ]
    },
    pieChart: {
      title: '用户分布分析',
      description: '以饼图形式展示用户角色分布和兴趣分类占比，支持多种图表样式和交互筛选。',
      features: [
        '分布展示：用户角色和兴趣分类占比',
        '图表样式：环形图、饼图、玫瑰图',
        '交互筛选：点击扇区进行快速筛选',
        '统计信息：显示总数、最大占比等'
      ],
      interactions: [
        '点击扇区选择特定分类进行筛选',
        '悬停查看具体数量和百分比',
        '切换不同的图表显示样式',
        '查看详细数据表格'
      ]
    },
    network: {
      title: '关系网络分析',
      description: '使用力导向图展示用户间的互动关系，节点大小代表影响力，颜色表示兴趣分类。',
      features: [
        '关系展示：用户互动关系可视化',
        '节点属性：大小表示影响力，颜色表示分类',
        '力导向布局：自动优化节点位置',
        '关系筛选：支持按关系类型筛选'
      ],
      interactions: [
        '拖拽节点调整布局位置',
        '点击节点查看用户详情',
        '缩放查看局部网络结构',
        '选择节点高亮相关连接'
      ]
    },
    wordcloud: {
      title: '词云分析',
      description: '展示用户发帖中的高频关键词，词汇大小代表出现频率，结合时间趋势分析热点话题。',
      features: [
        '关键词展示：用户发帖高频词汇',
        '词频映射：词汇大小代表出现频率',
        '趋势分析：关键词时间变化趋势',
        '话题发现：识别热点话题和趋势'
      ],
      interactions: [
        '点击词汇查看相关用户和内容',
        '筛选特定词汇的时间趋势',
        '调整词云显示的词汇数量',
        '导出关键词统计数据'
      ]
    },
    geographic: {
      title: '地域分布分析',
      description: '在地图上展示用户的地理分布情况，支持按活跃度、影响力等维度切换显示。',
      features: [
        '地图展示：用户地理位置分布',
        '多维度：按活跃度、影响力等切换',
        '区域统计：显示各地区用户数量',
        '热点识别：识别用户集中的地区'
      ],
      interactions: [
        '缩放地图查看不同层级',
        '点击区域查看详细统计',
        '切换不同的显示维度',
        '筛选特定地区的用户'
      ]
    }
  }
  
  return details[props.viewType] || details.timeSeries
})

function handleClose() {
  emit('update:visible', false)
}
</script>

<style scoped>
.view-info-content {
  font-size: 0.9rem;
  line-height: 1.6;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h4 {
  color: #E6162D;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  margin-top: 0;
}

.info-section p {
  color: #4e5969;
  margin-bottom: 1rem;
  margin-top: 0;
}

.info-section ul {
  margin: 0;
  padding-left: 1.2rem;
  color: #1d2129;
}

.info-section li {
  margin-bottom: 0.5rem;
}

.info-section li:last-child {
  margin-bottom: 0;
}
</style> 