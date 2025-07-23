<template>
  <el-dialog 
    :model-value="visible" 
    title="导入CSV数据" 
    width="800px" 
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="upload-container">
      <!-- 格式说明 -->
      <el-alert
        v-if="!uploadedData.length"
        title="CSV文件格式说明"
        type="info"
        :closable="false"
        class="format-info"
      >
        <template #default>
          <div class="format-details">
            <p>支持的CSV列名示例：</p>
            <ul>
              <li><strong>用户信息：</strong>userId, role, interests, registrationDate, location</li>
              <li><strong>行为数据：</strong>activityScore, influenceScore, postCount, interactionCount, followerCount, followingCount</li>
              <li><strong>时间数据：</strong>timestamp, activeUserCount, newUserCount</li>
            </ul>
            <p class="note">注：系统会自动识别列名并映射到对应的数据字段</p>
            <div class="sample-download">
              <el-button 
                size="small" 
                type="primary" 
                link 
                @click="downloadSample('user')"
              >
                <el-icon><Download /></el-icon>
                下载用户数据模板
              </el-button>
              <el-button 
                size="small" 
                type="primary" 
                link 
                @click="downloadSample('timeseries')"
              >
                <el-icon><Download /></el-icon>
                下载时间序列模板
              </el-button>
            </div>
          </div>
        </template>
      </el-alert>

      <!-- 文件上传区域 -->
      <el-upload
        v-if="!uploadedData.length"
        class="upload-demo"
        drag
        action=""
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleFileChange"
        :accept="'.csv,.txt'"
        :disabled="isProcessing"
      >
        <el-icon class="el-icon--upload" :size="40">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          将CSV文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传CSV/TXT文件，文件大小不超过10MB
          </div>
        </template>
      </el-upload>

      <!-- 处理中状态 -->
      <div v-if="isProcessing" class="processing-state">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <div class="processing-text">正在解析文件...</div>
      </div>

      <!-- 数据预览 -->
      <div v-if="uploadedData.length && !isProcessing" class="data-preview">
        <div class="preview-header">
          <h4>数据预览</h4>
          <div class="data-stats">
            <el-tag type="success">共 {{ uploadedData.length }} 条记录</el-tag>
            <el-tag type="info">{{ Object.keys(uploadedData[0] || {}).length }} 个字段</el-tag>
          </div>
        </div>

        <!-- 字段映射状态 -->
        <div class="field-mapping" v-if="fieldMapping.size > 0">
          <h5>字段映射情况：</h5>
          <div class="mapping-chips">
            <el-tag 
              v-for="[original, mapped] in Array.from(fieldMapping.entries())" 
              :key="original"
              :type="mapped ? 'success' : 'warning'"
              size="small"
            >
              {{ original }} {{ mapped ? `→ ${mapped}` : '(未映射)' }}
            </el-tag>
          </div>
        </div>

        <!-- 数据表格预览 -->
        <el-table 
          :data="uploadedData.slice(0, 5)" 
          max-height="300"
          class="preview-table"
        >
          <el-table-column 
            v-for="(key, index) in Object.keys(uploadedData[0] || {})" 
            :key="index"
            :prop="key" 
            :label="key"
            :width="120"
            show-overflow-tooltip
          />
        </el-table>
        
        <div class="preview-note" v-if="uploadedData.length > 5">
          <el-text type="info" size="small">
            仅显示前5条记录，实际将导入全部 {{ uploadedData.length }} 条记录
          </el-text>
        </div>

        <!-- 数据类型分析 -->
        <div class="data-analysis" v-if="dataAnalysis">
          <h5>数据分析：</h5>
          <div class="analysis-grid">
            <div class="analysis-item" v-if="dataAnalysis.hasUserData">
              <el-icon><User /></el-icon>
              <span>包含用户数据</span>
            </div>
            <div class="analysis-item" v-if="dataAnalysis.hasBehaviorData">
              <el-icon><DataBoard /></el-icon>
              <span>包含行为数据</span>
            </div>
            <div class="analysis-item" v-if="dataAnalysis.hasTimeSeriesData">
              <el-icon><TrendCharts /></el-icon>
              <span>包含时间序列数据</span>
            </div>
          </div>
        </div>

        <!-- 验证结果 -->
        <div class="validation-results" v-if="validationErrors.length > 0">
          <el-alert
            title="数据验证警告"
            type="warning"
            :closable="false"
          >
            <ul>
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </el-alert>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="resetUpload" v-if="uploadedData.length">重新上传</el-button>
        <el-button 
          type="primary" 
          @click="handleImport"
          :disabled="!uploadedData.length || validationErrors.length > 0"
          :loading="isImporting"
        >
          导入数据
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading, User, DataBoard, TrendCharts, Download } from '@element-plus/icons-vue'
import type { AccountRole, AccountInterest } from '@/models'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'import'])

// 响应式数据
const uploadedData = ref<Record<string, any>[]>([])
const isProcessing = ref(false)
const isImporting = ref(false)
const fieldMapping = ref<Map<string, string>>(new Map())
const validationErrors = ref<string[]>([])

// 字段映射配置
const FIELD_MAPPINGS: Record<string, string[]> = {
  'userId': ['userid', 'user_id', 'id', '用户ID', '用户id'],
  'role': ['role', 'account_role', 'user_role', '角色', '用户角色'],
  'interests': ['interests', 'interest', 'user_interests', '兴趣', '用户兴趣'],
  'registrationDate': ['registration_date', 'reg_date', 'create_date', '注册时间', '创建时间'],
  'location': ['location', 'region', 'area', '地区', '位置'],
  'activityScore': ['activity_score', 'activity', 'active_score', '活跃度', '活跃分数'],
  'influenceScore': ['influence_score', 'influence', 'inf_score', '影响力', '影响力分数'],
  'postCount': ['post_count', 'posts', 'post_num', '发帖数', '帖子数'],
  'interactionCount': ['interaction_count', 'interactions', 'int_count', '互动数'],
  'followerCount': ['follower_count', 'followers', 'fan_count', '粉丝数', '关注者数'],
  'followingCount': ['following_count', 'following', 'follow_count', '关注数'],
  'timestamp': ['timestamp', 'time', 'date', 'datetime', '时间', '日期'],
  'activeUserCount': ['active_user_count', 'active_users', 'active_count', '活跃用户数'],
  'newUserCount': ['new_user_count', 'new_users', 'new_count', '新增用户数'],
  'lastActiveDate': ['last_active_date', 'last_active', 'last_login', '最后活跃时间']
}

// 数据分析结果
const dataAnalysis = computed(() => {
  if (!uploadedData.value.length) return null
  
  const fields = Object.keys(uploadedData.value[0])
  const mappedFields = Array.from(fieldMapping.value.values())
  
  return {
    hasUserData: mappedFields.some(field => ['userId', 'role', 'interests'].includes(field)),
    hasBehaviorData: mappedFields.some(field => ['activityScore', 'influenceScore', 'postCount'].includes(field)),
    hasTimeSeriesData: mappedFields.some(field => ['timestamp', 'activeUserCount'].includes(field))
  }
})

// 处理文件上传
async function handleFileChange(uploadFile: any) {
  const file = uploadFile.raw
  if (!file) return

  // 文件大小检查
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过10MB')
    return
  }

  isProcessing.value = true
  validationErrors.value = []

  try {
    const text = await readFileAsText(file)
    const parsedData = parseCSV(text)
    
    if (parsedData.length === 0) {
      throw new Error('CSV文件为空或格式不正确')
    }

    uploadedData.value = parsedData
    analyzeFields()
    validateData()
    
    ElMessage.success(`成功解析 ${parsedData.length} 条记录`)
  } catch (error) {
    console.error('解析文件失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '文件解析失败')
    resetUpload()
  } finally {
    isProcessing.value = false
  }
}

// 读取文件内容
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'UTF-8')
  })
}

// 解析CSV
function parseCSV(text: string): Record<string, any>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV文件至少需要包含标题行和一行数据')
  }

  // 解析标题行
  const headers = parseCSVLine(lines[0])
  if (headers.length === 0) {
    throw new Error('无法解析CSV标题行')
  }

  // 解析数据行
  const data: Record<string, any>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length > 0) {
      const row: Record<string, any> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }
  }

  return data
}

// 解析CSV行（处理引号和逗号）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // 跳过下一个引号
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result.map(val => val.replace(/^"|"$/g, ''))
}

// 分析字段映射
function analyzeFields() {
  const fields = Object.keys(uploadedData.value[0] || {})
  fieldMapping.value.clear()

  fields.forEach(field => {
    const normalizedField = field.toLowerCase().trim()
    
    // 查找匹配的标准字段
    for (const [standardField, variants] of Object.entries(FIELD_MAPPINGS)) {
      if (variants.some(variant => 
        normalizedField === variant.toLowerCase() || 
        normalizedField.includes(variant.toLowerCase())
      )) {
        fieldMapping.value.set(field, standardField)
        break
      }
    }
    
    // 如果没有找到映射，保持原字段名
    if (!fieldMapping.value.has(field)) {
      fieldMapping.value.set(field, '')
    }
  })
}

// 验证数据
function validateData() {
  validationErrors.value = []
  
  if (uploadedData.value.length === 0) {
    validationErrors.value.push('没有有效的数据行')
    return
  }

  // 检查必要字段
  const mappedFields = Array.from(fieldMapping.value.values())
  
  // 检查数据类型
  const sampleRow = uploadedData.value[0]
  Object.entries(sampleRow).forEach(([key, value]) => {
    const mappedField = fieldMapping.value.get(key)
    
    if (mappedField === 'activityScore' || mappedField === 'influenceScore') {
      const numValue = Number(value)
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        validationErrors.value.push(`${key} 字段应为0-100之间的数值`)
      }
    }
    
    if (mappedField === 'role') {
      const validRoles: AccountRole[] = ['inactive', 'information-seeker', 'information-source', 'general']
      if (value && !validRoles.includes(value as AccountRole)) {
        validationErrors.value.push(`${key} 字段包含无效的角色值: ${value}`)
      }
    }
  })

  // 检查数据一致性
  if (uploadedData.value.length > 1000) {
    validationErrors.value.push('数据量较大，导入可能需要较长时间')
  }
}

// 重置上传状态
function resetUpload() {
  uploadedData.value = []
  fieldMapping.value.clear()
  validationErrors.value = []
  isProcessing.value = false
  isImporting.value = false
}

// 处理导入
async function handleImport() {
  if (!uploadedData.value.length) return

  isImporting.value = true
  
  try {
    // 转换数据格式
    const processedData = processDataForImport()
    
    // 发送给父组件
    emit('import', processedData)
    
    ElMessage.success('数据导入成功！')
    handleClose()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('数据导入失败，请检查数据格式')
  } finally {
    isImporting.value = false
  }
}

// 处理数据用于导入
function processDataForImport() {
  const userProfiles: any[] = []
  const userBehaviors: any[] = []
  const timeSeriesData: any[] = []

  uploadedData.value.forEach(row => {
    const processedRow: Record<string, any> = {}
    
    // 根据字段映射转换数据
    Object.entries(row).forEach(([originalField, value]) => {
      const mappedField = fieldMapping.value.get(originalField)
      if (mappedField) {
        processedRow[mappedField] = convertValue(mappedField, value)
      }
    })

    // 根据数据类型分类
    if (processedRow.userId) {
      if (processedRow.role || processedRow.interests || processedRow.registrationDate) {
        userProfiles.push({
          userId: processedRow.userId,
          role: processedRow.role || 'general',
          interests: parseInterests(processedRow.interests),
          registrationDate: processedRow.registrationDate || new Date().toISOString(),
          location: processedRow.location
        })
      }
      
      if (processedRow.activityScore !== undefined || processedRow.influenceScore !== undefined) {
        userBehaviors.push({
          userId: processedRow.userId,
          activityScore: processedRow.activityScore || 0,
          influenceScore: processedRow.influenceScore || 0,
          postCount: processedRow.postCount || 0,
          interactionCount: processedRow.interactionCount || 0,
          followerCount: processedRow.followerCount || 0,
          followingCount: processedRow.followingCount || 0,
          lastActiveDate: processedRow.lastActiveDate || new Date().toISOString()
        })
      }
    }

    if (processedRow.timestamp) {
      timeSeriesData.push({
        timestamp: processedRow.timestamp,
        activeUserCount: processedRow.activeUserCount || 0,
        newUserCount: processedRow.newUserCount || 0,
        postCount: processedRow.postCount || 0,
        interactionCount: processedRow.interactionCount || 0,
        avgActivityScore: processedRow.avgActivityScore || 0,
        avgInfluenceScore: processedRow.avgInfluenceScore || 0
      })
    }
  })

  return {
    userProfiles: userProfiles.length > 0 ? userProfiles : null,
    userBehaviors: userBehaviors.length > 0 ? userBehaviors : null,
    timeSeriesData: timeSeriesData.length > 0 ? timeSeriesData : null,
    rawData: uploadedData.value
  }
}

// 转换值类型
function convertValue(field: string, value: any): any {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  switch (field) {
    case 'activityScore':
    case 'influenceScore':
    case 'postCount':
    case 'interactionCount':
    case 'followerCount':
    case 'followingCount':
    case 'activeUserCount':
    case 'newUserCount':
      return Number(value) || 0
    
    case 'registrationDate':
    case 'lastActiveDate':
    case 'timestamp':
      return new Date(value).toISOString()
    
    default:
      return String(value).trim()
  }
}

// 解析兴趣字段
function parseInterests(interestsStr: any): AccountInterest[] {
  if (!interestsStr) return []
  
  const interests = String(interestsStr)
    .split(/[,;|]/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  
  const validInterests: AccountInterest[] = [
    'animals', 'arts and culture', 'business and finance', 'entertainment',
    'fashion and beauty', 'fitness and health', 'food and dining',
    'learning and educational', 'politics', 'science and technology',
    'sports', 'travel'
  ]
  
  return interests.filter(interest => 
    validInterests.includes(interest as AccountInterest)
  ) as AccountInterest[]
}

// 下载样例数据
function downloadSample(type: 'user' | 'timeseries') {
  let csvContent = ''
  let filename = ''
  
  if (type === 'user') {
    csvContent = `userId,role,interests,registrationDate,location,activityScore,influenceScore,postCount,interactionCount,followerCount,followingCount,lastActiveDate
user_001,information-source,"science and technology,business and finance",2023-01-15,北京,85,72,156,1245,5680,234,2024-01-20
user_002,general,"entertainment,sports",2022-08-22,上海,45,38,67,543,1200,150,2024-01-19
user_003,information-seeker,"learning and educational,arts and culture",2023-05-10,广州,62,25,23,789,890,400,2024-01-18`
    filename = 'sample-user-data.csv'
  } else {
    csvContent = `timestamp,activeUserCount,newUserCount,postCount,interactionCount,avgActivityScore,avgInfluenceScore
2024-01-01T00:00:00.000Z,245,12,456,2345,58.5,45.2
2024-01-02T00:00:00.000Z,267,8,523,2789,61.2,47.8
2024-01-03T00:00:00.000Z,234,15,389,2156,55.8,43.6`
    filename = 'sample-timeseries-data.csv'
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`已下载 ${filename} 模板文件`)
}

// 关闭对话框
function handleClose() {
  resetUpload()
  emit('close')
}
</script>

<style scoped>
.upload-container {
  padding: 1rem 0;
}

.format-info {
  margin-bottom: 1.5rem;
}

.format-details ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.format-details li {
  margin: 0.25rem 0;
}

.note {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #666;
}

.sample-download {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.upload-demo {
  width: 100%;
  margin-bottom: 1.5rem;
}

.processing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #666;
}

.processing-text {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.data-preview {
  margin-top: 1.5rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-header h4 {
  margin: 0;
  color: #333;
}

.data-stats {
  display: flex;
  gap: 0.5rem;
}

.field-mapping {
  margin-bottom: 1rem;
}

.field-mapping h5 {
  margin: 0 0 0.5rem 0;
  color: #555;
  font-size: 0.875rem;
}

.mapping-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preview-table {
  margin-bottom: 1rem;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.preview-note {
  text-align: center;
  margin-bottom: 1rem;
}

.data-analysis h5 {
  margin: 1rem 0 0.5rem 0;
  color: #555;
  font-size: 0.875rem;
}

.analysis-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #666;
}

.validation-results {
  margin-top: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style> 