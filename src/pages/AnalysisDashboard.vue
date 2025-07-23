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
          <el-dropdown @command="handleDataCommand" class="data-actions">
            <el-button>
              <el-icon><UploadFilled /></el-icon>
              数据管理
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="import">
                  <el-icon><UploadFilled /></el-icon>
                  导入CSV数据
                </el-dropdown-item>
                <el-dropdown-item command="mock" divided>
                  <el-icon><DataBoard /></el-icon>
                  生成示例数据
                </el-dropdown-item>
                <el-dropdown-item command="clear" divided>
                  <el-icon><Delete /></el-icon>
                  清空所有数据
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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

        <!-- 散点图分析视图 -->
        <div class="view-container" v-if="viewConfigs.scatter.isVisible">
          <ViewCard 
            :title="viewConfigs.scatter.title"
            :viewType="'scatter'"
            @toggleVisibility="toggleViewVisibility"
            @showInfo="handleShowViewInfo"
          >
            <ScatterChart 
              :data="scatterData"
              :selection="selectionState"
              :loading="isLoading"
              @selectionChange="handleSelectionChange"
            />
          </ViewCard>
        </div>

        <!-- 热力图视图 -->
        <div class="view-container" v-if="viewConfigs.heatmap.isVisible">
          <ViewCard 
            :title="viewConfigs.heatmap.title"
            :viewType="'heatmap'"
            @toggleVisibility="toggleViewVisibility"
            @showInfo="handleShowViewInfo"
          >
            <HeatmapChart 
              :data="heatmapData"
              :loading="isLoading"
              :selection="selectionState"
              @selectionChange="handleSelectionChange"
            />
          </ViewCard>
        </div>

        <!-- 用户分布饼图视图 -->
        <div class="view-container" v-if="viewConfigs.pieChart.isVisible">
          <ViewCard 
            :title="viewConfigs.pieChart.title"
            :viewType="'pieChart'"
            @toggleVisibility="toggleViewVisibility"
            @showInfo="handleShowViewInfo"
          >
            <PieChart 
              :roleDistribution="currentStats?.roleDistribution"
              :interestDistribution="currentStats?.interestDistribution"
              :selection="selectionState"
              :loading="isLoading"
              @selectionChange="handleSelectionChange"
            />
          </ViewCard>
        </div>
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

    <FileUploadDialog 
      :visible="showUploadDialog" 
      @close="showUploadDialog = false" 
      @import="handleCsvData" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAnalysisStore } from '@/stores'
import type { FilterCondition, SelectionState, ViewType } from '@/models'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  Refresh,
  Filter,
  Loading,
  UploadFilled,
  ArrowDown,
  DataBoard,
  Delete
} from '@element-plus/icons-vue'

// 导入组件
import FilterPanel from '@/components/FilterPanel.vue'
import ViewCard from '@/components/ViewCard.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import ScatterChart from '@/components/charts/ScatterChart.vue'
import HeatmapChart from '@/components/charts/HeatmapChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import ViewInfoDialog from '@/components/ViewInfoDialog.vue'
import FileUploadDialog from '@/components/FileUploadDialog.vue'

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
const showUploadDialog = ref(false)

// 计算属性
const hasData = computed(() => {
  return currentStats.value && currentStats.value.totalUsers > 0
})

// 方法
async function refreshData() {
  try {
    await analysisStore.loadData()
    // 这里可以添加成功提示
  } catch (error) {
    console.error('Failed to refresh data:', error)
    // 这里可以添加错误提示
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

async function handleCsvData(processedData: any) {
  try {
    // 调用store的导入方法
    const result = await analysisStore.importData(processedData)
    
    if (result.success) {
      const { summary } = result
      let message = '数据导入成功！'
      
      if (summary.userProfiles > 0 || summary.userBehaviors > 0 || summary.timeSeriesData > 0) {
        const details = []
        if (summary.userProfiles > 0) details.push(`${summary.userProfiles} 个用户配置`)
        if (summary.userBehaviors > 0) details.push(`${summary.userBehaviors} 个用户行为`)
        if (summary.timeSeriesData > 0) details.push(`${summary.timeSeriesData} 个时间序列数据`)
        
        message += `\n导入内容：${details.join('，')}`
      }
      
      ElMessage({
        message,
        type: 'success',
        duration: 5000,
        showClose: true
      })
    }
  } catch (error) {
    console.error('数据导入失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '数据导入失败')
  }
}

function handleDataCommand(command: string) {
  if (command === 'import') {
    showUploadDialog.value = true
  } else if (command === 'mock') {
    analysisStore.generateMockData()
    ElMessage.success('已生成示例数据')
  } else if (command === 'clear') {
    ElMessageBox.confirm('确定要清空所有数据吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      analysisStore.clearAllData()
      ElMessage.success('数据已清空')
    }).catch(() => {
      // 用户取消
    })
  }
}

// 生命周期
onMounted(async () => {
  // 初始化加载数据
  await refreshData()
})
</script>

<style scoped>
.analysis-dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  position: relative;
}

/* 顶部导航栏 */
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

.data-actions .el-button {
  background: #f0f0f0;
  border-color: #e0e0e0;
  color: #333;
}

.data-actions .el-button:hover {
  background: #e0e0e0;
  border-color: #d0d0d0;
  color: #333;
}

/* 统计概览卡片 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(230, 22, 45, 0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #E6162D;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #4e5969;
  font-weight: 500;
}

/* 仪表板内容区域 */
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.interaction-history {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 视图网格布局 */
.views-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.views-grid.with-filter {
  margin-top: 1rem;
}

.view-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 400px;
}

.view-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 加载遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-text {
  margin-top: 1rem;
  font-size: 1rem;
  color: #4e5969;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .views-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

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
  
  .stats-overview {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .dashboard-content {
    padding: 0 1rem 1rem;
  }
  
  .views-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .view-container {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .dashboard-title {
    font-size: 1.25rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 