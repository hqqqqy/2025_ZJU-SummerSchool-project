<template>
  <div class="data-import">
    <el-upload
      action=""
      accept=".csv"
      :show-file-list="false"
      :auto-upload="false"
      :on-change="handleFileChange"
      :disabled="isLoading"
    >
      <el-button
        type="primary"
        :loading="isLoading"
        :icon="Upload"
        class="import-button"
      >
        {{ isLoading ? '导入中...' : '导入CSV数据' }}
      </el-button>
    </el-upload>
    
    <el-tooltip 
      content="下载示例CSV模板" 
      placement="top"
    >
      <el-button
        text
        :icon="Download"
        @click="downloadTemplate"
        class="template-button"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAnalysisStore } from '@/stores'
import { ElMessage, ElNotification } from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'

const analysisStore = useAnalysisStore()
const isLoading = ref(false)

const handleFileChange = async (file: any) => {
  if (!file.raw) return
  
  // 验证文件类型
  if (!file.name.endsWith('.csv')) {
    ElMessage.error('仅支持CSV格式文件')
    return
  }

  isLoading.value = true
  try {
    const text = await file.raw.text()
    await analysisStore.loadCSVData(text)
    
    ElNotification({
      title: '导入成功',
      message: `已加载 ${analysisStore.userProfiles.length} 条用户数据`,
      type: 'success',
      position: 'bottom-right'
    })
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error(`导入失败: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isLoading.value = false
  }
}

const downloadTemplate = () => {
  const template = `user_id,registration_date,location,last_active_date,role,interests,post_count,like_count,repost_count,comment_count,follower_count,following_count,interactions
user1,2023-01-15,北京,2023-06-20,general,"technology,sports",120,450,80,150,5000,300,680
user2,2022-11-03,上海,2023-06-18,information-source,"entertainment,fashion",350,1200,250,300,15000,200,1750`

  const blob = new Blob([template], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'weibo_data_template.csv'
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('模板下载成功')
}
</script>

<style scoped>
.data-import {
  display: flex;
  align-items: center;
  gap: 8px;
}

.import-button {
  padding: 8px 15px;
  height: auto;
}

.template-button {
  padding: 8px;
  color: var(--el-color-primary);
}

.template-button:hover {
  background-color: var(--el-color-primary-light-9);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .data-import {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .import-button {
    width: 100%;
    margin-bottom: 8px;
  }
}
</style>
