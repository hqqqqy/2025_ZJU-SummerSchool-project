<template>
  <div class="view-card">
    <div class="view-header">
      <div class="view-title">
        <h3>{{ title }}</h3>
        <div class="view-status" v-if="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
      </div>
      <div class="view-actions">
        <el-tooltip content="视图说明" placement="top">
          <el-button 
            size="small" 
            text 
            @click="$emit('showInfo', viewType)"
            class="action-button"
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="截图导出" placement="top">
          <el-button 
            size="small" 
            text 
            @click="exportChart"
            class="action-button"
          >
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="全屏显示" placement="top">
          <el-button 
            size="small" 
            text 
            @click="toggleFullscreen"
            class="action-button"
          >
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="隐藏视图" placement="top">
          <el-button 
            size="small" 
            text 
            @click="$emit('toggleVisibility', viewType)"
            class="action-button"
          >
            <el-icon><Hide /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    
    <div class="view-content" ref="contentRef">
      <slot />
    </div>
    
    <!-- 全屏模态框 -->
    <el-dialog 
      v-model="isFullscreen" 
      :title="title"
      width="90%"
      destroy-on-close
      class="fullscreen-dialog"
    >
      <div class="fullscreen-content">
        <slot name="fullscreen">
          <slot />
        </slot>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ViewType } from '@/models'
import {
  QuestionFilled,
  Download,
  FullScreen,
  Hide,
  Loading
} from '@element-plus/icons-vue'
import html2canvas from 'html2canvas'
import { ElMessage } from 'element-plus'

interface Props {
  title: string
  viewType: ViewType
  loading?: boolean
}

interface Emits {
  (e: 'showInfo', viewType: ViewType): void
  (e: 'toggleVisibility', viewType: ViewType): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const contentRef = ref<HTMLElement>()
const isFullscreen = ref(false)

async function exportChart() {
  if (!contentRef.value) return
  
  try {
    const canvas = await html2canvas(contentRef.value, {
      backgroundColor: '#ffffff',
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true
    })
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `${props.title}_${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    ElMessage.success('图表导出成功')
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('图表导出失败')
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}
</script>

<style scoped>
.view-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  min-height: 60px;
}

.view-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d2129;
}

.view-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #86909c;
}

.view-actions {
  display: flex;
  gap: 0.25rem;
}

.action-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: #f2f3f5;
  color: #E6162D;
}

.view-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 全屏对话框样式 */
:deep(.fullscreen-dialog) {
  .el-dialog {
    margin: 5vh auto;
    height: 90vh;
  }
  
  .el-dialog__body {
    padding: 0;
    height: calc(90vh - 120px);
  }
}

.fullscreen-content {
  height: 100%;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .view-header {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .view-title {
    width: 100%;
    justify-content: space-between;
  }
  
  .view-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .action-button {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 480px) {
  .view-title h3 {
    font-size: 1rem;
  }
  
  .view-header {
    padding: 0.5rem;
  }
}
</style> 