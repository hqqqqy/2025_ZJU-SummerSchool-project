<template>
  <div class="filter-panel">
    <div class="panel-header">
      <h3>智能筛选</h3>
      <div class="header-actions">
        <el-button size="small" @click="resetAll">重置</el-button>
        <el-button size="small" type="primary" @click="applyFilters">应用筛选</el-button>
      </div>
    </div>

    <div class="panel-content">
      <!-- 时间范围筛选 -->
      <div class="filter-section">
        <div class="section-title">
          <el-icon><Calendar /></el-icon>
          时间范围
        </div>
        <div class="filter-content">
          <div class="date-shortcuts">
            <el-button 
              size="small" 
              :type="isQuickRangeSelected('7d') ? 'primary' : ''"
              @click="setQuickRange('7d')"
            >
              近7天
            </el-button>
            <el-button 
              size="small"
              :type="isQuickRangeSelected('30d') ? 'primary' : ''"
              @click="setQuickRange('30d')"
            >
              近30天
            </el-button>
            <el-button 
              size="small"
              :type="isQuickRangeSelected('90d') ? 'primary' : ''"
              @click="setQuickRange('90d')"
            >
              近90天
            </el-button>
          </div>
          <el-date-picker
            v-model="localFilter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="small"
            style="width: 100%"
            @change="onDateRangeChange"
          />
        </div>
      </div>

      <!-- 活跃度范围 -->
      <div class="filter-section">
        <div class="section-title">
          <el-icon><TrendCharts /></el-icon>
          活跃度范围
        </div>
        <div class="filter-content">
          <el-slider
            v-model="activityRange"
            range
            :min="0"
            :max="100"
            :step="5"
            show-stops
            @change="onActivityRangeChange"
          />
          <div class="range-labels">
            <span>{{ activityRange[0] }}</span>
            <span>{{ activityRange[1] }}</span>
          </div>
        </div>
      </div>

      <!-- 影响力范围 -->
      <div class="filter-section">
        <div class="section-title">
          <el-icon><Star /></el-icon>
          影响力范围
        </div>
        <div class="filter-content">
          <el-slider
            v-model="influenceRange"
            range
            :min="0"
            :max="100"
            :step="5"
            show-stops
            @change="onInfluenceRangeChange"
          />
          <div class="range-labels">
            <span>{{ influenceRange[0] }}</span>
            <span>{{ influenceRange[1] }}</span>
          </div>
        </div>
      </div>

      <!-- 用户角色筛选 -->
      <div class="filter-section">
        <div class="section-title">
          <el-icon><User /></el-icon>
          用户角色
        </div>
        <div class="filter-content">
          <el-checkbox-group v-model="selectedRoles" @change="onRolesChange">
            <el-checkbox 
              v-for="role in accountRoles" 
              :key="role" 
              :label="role"
              class="role-checkbox"
            >
              {{ getRoleName(role) }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

      <!-- 兴趣分类筛选 -->
      <div class="filter-section">
        <div class="section-title">
          <el-icon><Collection /></el-icon>
          兴趣分类
        </div>
        <div class="filter-content">
          <div class="interests-grid">
            <el-tag
              v-for="interest in accountInterests"
              :key="interest"
              :type="selectedInterests.includes(interest) ? '' : 'info'"
              :effect="selectedInterests.includes(interest) ? 'dark' : 'plain'"
              :color="selectedInterests.includes(interest) ? interestColorMap[interest] : ''"
              class="interest-tag"
              @click="toggleInterest(interest)"
            >
              {{ getInterestName(interest) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 当前筛选状态 -->
      <div class="filter-section" v-if="hasActiveFilters">
        <div class="section-title">
          <el-icon><Filter /></el-icon>
          当前筛选条件
        </div>
        <div class="filter-content">
          <div class="active-filters">
            <el-tag
              v-if="localFilter.dateRange && localFilter.dateRange[0]"
              closable
              @close="clearDateRange"
              size="small"
            >
              时间: {{ localFilter.dateRange[0] }} 至 {{ localFilter.dateRange[1] }}
            </el-tag>
            
            <el-tag
              v-if="activityRange[0] > 0 || activityRange[1] < 100"
              closable
              @close="clearActivityRange"
              size="small"
            >
              活跃度: {{ activityRange[0] }}-{{ activityRange[1] }}
            </el-tag>
            
            <el-tag
              v-if="influenceRange[0] > 0 || influenceRange[1] < 100"
              closable
              @close="clearInfluenceRange"
              size="small"
            >
              影响力: {{ influenceRange[0] }}-{{ influenceRange[1] }}
            </el-tag>
            
            <el-tag
              v-for="role in selectedRoles"
              :key="`role-${role}`"
              closable
              @close="toggleRole(role)"
              size="small"
            >
              {{ getRoleName(role) }}
            </el-tag>
            
            <el-tag
              v-for="interest in selectedInterests"
              :key="`interest-${interest}`"
              closable
              @close="toggleInterest(interest)"
              size="small"
              :color="interestColorMap[interest]"
            >
              {{ getInterestName(interest) }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { accountRoles, accountInterests, type AccountRole, type AccountInterest, type FilterCondition } from '@/models'
import { interestColorMap } from '@/util/colors'
import {
  Calendar,
  TrendCharts,
  Star,
  User,
  Collection,
  Filter
} from '@element-plus/icons-vue'

interface Props {
  modelValue?: FilterCondition
}

interface Emits {
  (e: 'update:modelValue', value: FilterCondition): void
  (e: 'filterChange', value: Partial<FilterCondition>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地状态
const localFilter = ref<FilterCondition>({
  dateRange: props.modelValue?.dateRange || undefined,
  activityRange: props.modelValue?.activityRange || { min: 0, max: 100 },
  influenceRange: props.modelValue?.influenceRange || { min: 0, max: 100 },
  roles: props.modelValue?.roles || [],
  interests: props.modelValue?.interests || [],
  regions: props.modelValue?.regions || [],
  userIds: props.modelValue?.userIds || []
})

const activityRange = ref<[number, number]>([
  localFilter.value.activityRange?.min || 0,
  localFilter.value.activityRange?.max || 100
])

const influenceRange = ref<[number, number]>([
  localFilter.value.influenceRange?.min || 0,
  localFilter.value.influenceRange?.max || 100
])

const selectedRoles = ref<AccountRole[]>(localFilter.value.roles || [])
const selectedInterests = ref<AccountInterest[]>(localFilter.value.interests || [])

// 计算属性
const hasActiveFilters = computed(() => {
  return !!(
    (localFilter.value.dateRange && localFilter.value.dateRange[0]) ||
    activityRange.value[0] > 0 ||
    activityRange.value[1] < 100 ||
    influenceRange.value[0] > 0 ||
    influenceRange.value[1] < 100 ||
    selectedRoles.value.length > 0 ||
    selectedInterests.value.length > 0
  )
})

// 方法
function isQuickRangeSelected(range: string): boolean {
  if (!localFilter.value.dateRange) return false
  
  const now = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  return localFilter.value.dateRange[0] === startDate.toISOString().split('T')[0] &&
         localFilter.value.dateRange[1] === now.toISOString().split('T')[0]
}

function setQuickRange(range: string) {
  const now = new Date()
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  localFilter.value.dateRange = [
    startDate.toISOString().split('T')[0],
    now.toISOString().split('T')[0]
  ]
  
  applyFilters()
}

function onDateRangeChange(value: [string, string] | null) {
  if (value) {
    localFilter.value.dateRange = { start: value[0], end: value[1] }
  } else {
    localFilter.value.dateRange = undefined
  }
  applyFilters()
}

function onActivityRangeChange(value: [number, number]) {
  localFilter.value.activityRange = { min: value[0], max: value[1] }
  applyFilters()
}

function onInfluenceRangeChange(value: [number, number]) {
  localFilter.value.influenceRange = { min: value[0], max: value[1] }
  applyFilters()
}

function onRolesChange(value: AccountRole[]) {
  localFilter.value.roles = value
  applyFilters()
}

function toggleRole(role: AccountRole) {
  const index = selectedRoles.value.indexOf(role)
  if (index > -1) {
    selectedRoles.value.splice(index, 1)
  } else {
    selectedRoles.value.push(role)
  }
  localFilter.value.roles = selectedRoles.value
  applyFilters()
}

function toggleInterest(interest: AccountInterest) {
  const index = selectedInterests.value.indexOf(interest)
  if (index > -1) {
    selectedInterests.value.splice(index, 1)
  } else {
    selectedInterests.value.push(interest)
  }
  localFilter.value.interests = selectedInterests.value
  applyFilters()
}

function clearDateRange() {
  localFilter.value.dateRange = undefined
  applyFilters()
}

function clearActivityRange() {
  activityRange.value = [0, 100]
  localFilter.value.activityRange = { min: 0, max: 100 }
  applyFilters()
}

function clearInfluenceRange() {
  influenceRange.value = [0, 100]
  localFilter.value.influenceRange = { min: 0, max: 100 }
  applyFilters()
}

function resetAll() {
  localFilter.value = {
    dateRange: undefined,
    activityRange: { min: 0, max: 100 },
    influenceRange: { min: 0, max: 100 },
    roles: [],
    interests: [],
    regions: [],
    userIds: []
  }
  
  activityRange.value = [0, 100]
  influenceRange.value = [0, 100]
  selectedRoles.value = []
  selectedInterests.value = []
  
  applyFilters()
}

function applyFilters() {
  emit('update:modelValue', localFilter.value)
  emit('filterChange', localFilter.value)
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

function getInterestName(interest: AccountInterest): string {
  const interestNames: Record<AccountInterest, string> = {
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
  return interestNames[interest]
}

// 监听外部props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localFilter.value = { ...newValue }
    activityRange.value = [
      newValue.activityRange?.min || 0,
      newValue.activityRange?.max || 100
    ]
    influenceRange.value = [
      newValue.influenceRange?.min || 0,
      newValue.influenceRange?.max || 100
    ]
    selectedRoles.value = newValue.roles || []
    selectedInterests.value = newValue.interests || []
  }
}, { deep: true })

onMounted(() => {
  // 初始化时发送当前筛选条件
  if (hasActiveFilters.value) {
    applyFilters()
  }
})
</script>

<style scoped>
.filter-panel {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1d2129;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.panel-content {
  padding: 1.5rem;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.section-title .el-icon {
  color: #E6162D;
}

.filter-content {
  padding-left: 1.5rem;
}

.date-shortcuts {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #86909c;
}

.role-checkbox {
  display: block;
  margin-bottom: 0.5rem;
}

.interests-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.interest-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.interest-tag:hover {
  transform: scale(1.05);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .panel-header {
    padding: 1rem;
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-end;
  }
  
  .panel-content {
    padding: 1rem;
  }
  
  .filter-content {
    padding-left: 0;
  }
  
  .date-shortcuts {
    flex-wrap: wrap;
  }
  
  .interests-grid {
    justify-content: center;
  }
}
</style> 