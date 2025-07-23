<template>
  <div class="analysis-dashboard">
    <!-- 顶部导航栏 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="dashboard-title">
            <el-icon><DataAnalysis /></el-icon>
            微博用户行为分析仪表板
          </h1>
          <div class="last-update" v-if="lastUpdateTime">
            最后更新: {{ formatUpdateTime(lastUpdateTime) }}
          </div>
        </div>
        <div class="header-actions">
          <!-- 新增的数据导入按钮 -->
          <el-tooltip content="导入CSV数据" placement="bottom">
            <el-upload
              action=""
              accept=".csv"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleFileImport"
              class="data-import"
            >
              <el-button type="primary" :loading="importLoading">
                <el-icon><Upload /></el-icon>
                导入数据
              </el-button>
            </el-upload>
          </el-tooltip>
          
          <el-button 
            type="primary" 
            :loading="isLoading"
            @click="refreshData"
            class="refresh-button"
          >
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button @click="showFilterPanel = !showFilterPanel">
            <el-icon><Filter /></el-icon>
            {{ showFilterPanel ? '隐藏筛选' : '显示筛选' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="stats-overview" v-if="currentStats">
      <div class="stats-card">
        <div class="stat-value">{{ formatNumber(currentStats.totalUsers) }}</div>
        <div class="stat-label">总用户数</div>
      </div>
      <div class="stats-card">
        <div class="stat-value">{{ formatNumber(currentStats.activeUsers) }}</div>
        <div class="stat-label">活跃用户</div>
      </div>
      <div class="stats-card">
        <div class="stat-value">{{ formatNumber(currentStats.totalPosts) }}</div>
        <div class="stat-label">总发帖数</div>
      </div>
      <div class="stats-card">
        <div class="stat-value">{{ formatNumber(currentStats.totalInteractions) }}</div>
        <div class="stat-label">总互动数</div>
      </div>
      <div class="stats-card">
        <div class="stat-value">{{ currentStats.avgActivityScore.toFixed(1) }}</div>
        <div class="stat-label">平均活跃度</div>
      </div>
      <div class="stats-card">
        <div class="stat-value">{{ currentStats.avgInfluenceScore.toFixed(1) }}</div>
        <div class="stat-label">平均影响力</div>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- 筛选面板 -->
      <FilterPanel 
        v-show="showFilterPanel"
        class="filter-panel"
        @filterChange="handleFilterChange"
      />

      <!-- 交互历史轨迹 -->
      <InteractionHistory 
        v-if="interactionHistory.length > 0"
        class="interaction-history"
        :interactions="interactionHistory.slice(0, 5)"
        @revert="handleRevert"
      />

      <!-- 可视化视图网格 -->
      <div class="views-grid" :class="{ 'with-filter': showFilterPanel }">
        <!-- 时间序列分析视图 -->
        <div class="view-container" v-if="viewConfigs.timeSeries.isVisible">
          <ViewCard 
            :title="viewConfigs.timeSeries.title"
            :viewType="'timeSeries'"
            @toggleVisibility="toggleViewVisibility"
            @showInfo="handleShowViewInfo"
          >
            <TimeSeriesChart 
              :data="filteredTimeSeriesData"
              :loading="isLoading"
            />
          </ViewCard>
        </div>

        <!-- 其他视图... -->
      </div>
    </div>

    <!-- 视图说明对话框 -->
    <ViewInfoDialog 
      v-model:visible="showViewInfoDialog"
      :viewType="currentViewInfo"
    />

    <!-- 加载遮罩 -->
    <div v-if="isLoading" class="loading-overlay">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <div class="loading-text">正在加载数据...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores'
import type { FilterCondition, SelectionState, ViewType } from '@/models'
import {
  DataAnalysis,
  Refresh,
  Filter,
  Loading,
  Upload
} from '@element-plus/icons-vue'

// 导入组件
import FilterPanel from '@/components/FilterPanel.vue'
import ViewCard from '@/components/ViewCard.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import ScatterChart from '@/components/charts/ScatterChart.vue'
import HeatmapChart from '@/components/charts/HeatmapChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import ViewInfoDialog from '@/components/ViewInfoDialog.vue'
import InteractionHistory from '@/components/InteractionHistory.vue'
import NetworkChart from '@/components/charts/NetworkChart.vue'

const router = useRouter()
const analysisStore = useAnalysisStore()

// 从store获取响应式数据
const {
  isLoading,
  lastUpdateTime,
  currentStats,
  filteredTimeSeriesData,
  scatterData,
  heatmapData,
  networkNodes,
  networkEdges,
  selectionState,
  interactionHistory,
  viewConfigs
} = storeToRefs(analysisStore)

// 本地响应式状态
const showFilterPanel = ref(true)
const showViewInfoDialog = ref(false)
const currentViewInfo = ref<ViewType>('timeSeries')
const importLoading = ref(false) // 新增的导入状态

// 计算属性
const hasData = computed(() => {
  return currentStats.value && currentStats.value.totalUsers > 0
})

// 方法
async function refreshData() {
  try {
    await analysisStore.loadData()
  } catch (error) {
    console.error('Failed to refresh data:', error)
  }
}

// 新增的CSV导入处理方法
async function handleFileImport(file: any) {
  if (!file.raw.type.includes('csv') && !file.name.endsWith('.csv')) {
    ElMessage.error('请上传CSV格式文件')
    return
  }

  importLoading.value = true
  try {
    const text = await file.raw.text()
    await analysisStore.loadCSVData(text)
    ElMessage.success(`成功导入 ${analysisStore.userProfiles.length} 条用户数据`)
  } catch (error: any) {
    ElMessage.error(`导入失败: ${error.message}`)
  } finally {
    importLoading.value = false
  }
}

function handleFilterChange(newFilter: Partial<FilterCondition>) {
  analysisStore.updateFilter(newFilter)
}

function handleSelectionChange(newSelection: Partial<SelectionState>) {
  analysisStore.updateSelection(newSelection)
}

function handleRevert(recordId: string) {
  analysisStore.revertToHistory(recordId)
}

function toggleViewVisibility(viewType: ViewType) {
  analysisStore.toggleViewVisibility(viewType)
}

function handleShowViewInfo(viewType: ViewType) {
  currentViewInfo.value = viewType
  showViewInfoDialog.value = true
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function formatUpdateTime(time: string): string {
  return new Date(time).toLocaleString('zh-CN')
}

// 生命周期
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.analysis-dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  position: relative;
}

/* 新增数据导入按钮样式 */
.data-import {
  margin-right: 12px;
}

/* 原有样式保持不变 */
.dashboard-header {
  background: white;
  border-bottom: 1px solid #e5e6eb;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dashboard-title .el-icon {
  color: #E6162D;
}

.last-update {
  font-size: 0.875rem;
  color: #86909c;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.refresh-button {
  background: #E6162D;
  border-color: #E6162D;
}

.refresh-button:hover {
  background: #d01428;
  border-color: #d01428;
}

/* ...其他原有样式... */

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .data-import {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}
</style>
