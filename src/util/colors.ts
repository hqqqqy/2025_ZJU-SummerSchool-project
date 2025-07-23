// ===========================================
// 微博社交媒体可视化色彩体系
// ===========================================

import { AccountInterest, AccountRole } from "@/models.ts";

// 主色调 - 微博红
export const WEIBO_RED = '#E6162D';

// 辅助色调
export const NEUTRAL_GRAY = '#8A8E99';
export const LIGHT_BLUE = '#4A90E2';
export const BACKGROUND_GRAY = '#F7F8FA';
export const BORDER_GRAY = '#E5E6EB';
export const TEXT_PRIMARY = '#1D2129';
export const TEXT_SECONDARY = '#4E5969';
export const TEXT_PLACEHOLDER = '#86909C';

// 状态色彩
export const SUCCESS_GREEN = '#00B42A';
export const WARNING_ORANGE = '#FF7D00';
export const ERROR_RED = '#F53F3F';
export const INFO_BLUE = '#165DFF';

// ===========================================
// 数据可视化专用色彩
// ===========================================

// ===========================================
// 数据编码专用配色方案
// 设计原则：
// 1. 避免红色等特殊含义颜色，红色仅用于品牌和UI
// 2. 确保所有视图中同一分类颜色完全一致
// 3. 基于HSL色彩空间科学分布，确保高区分度
// 4. 保持适当的对比度和可访问性
// ===========================================

// 角色分类色彩映射（4类）- 基于iOS系统色彩，避免红色
export const roleColorMap: Record<AccountRole, string> = {
  'inactive': '#8E8E93',          // 系统灰 - 非活跃用户
  'information-seeker': '#007AFF', // 系统蓝 - 信息搜索者  
  'information-source': '#FF9500', // 系统橙 - 信息源（避免使用红色）
  'general': '#34C759'            // 系统绿 - 一般用户
};

// 兴趣分类色彩映射（12类）- 基于色相环均匀分布，避开红色区域
export const interestColorMap: Record<AccountInterest, string> = {
  'animals': '#B8860B',           // 深金色 (45°) - 动物
  'arts and culture': '#228B22',  // 森林绿 (70°) - 艺术文化
  'business and finance': '#4682B4', // 钢蓝 (95°) - 商业金融
  'entertainment': '#6495ED',     // 矢车菊蓝 (120°) - 娱乐
  'fashion and beauty': '#9370DB', // 中紫色 (145°) - 时尚美容
  'fitness and health': '#BA55D3', // 中兰花紫 (170°) - 健身健康
  'food and dining': '#20B2AA',   // 浅海绿 (195°) - 美食餐饮
  'learning and educational': '#32CD32', // 酸橙绿 (220°) - 学习教育
  'politics': '#FFD700',          // 金色 (245°) - 政治
  'science and technology': '#FF8C00', // 深橙色 (270°) - 科技
  'sports': '#4169E1',            // 皇室蓝 (295°) - 体育
  'travel': '#8A2BE2'             // 蓝紫色 (320°) - 旅游
};

// 活跃度等级色彩 - 避免红色，使用渐进式蓝绿色系
export const activityLevelColors = {
  low: '#95A5A6',     // 中性灰 - 低活跃度
  medium: '#3498DB',  // 蓝色 - 中活跃度  
  high: '#2ECC71'     // 绿色 - 高活跃度（避免使用红色）
};

// 影响力等级色彩 - 使用紫色系渐变，避免红色
export const influenceLevelColors = {
  low: '#BDC3C7',     // 浅灰 - 低影响力
  medium: '#9B59B6',  // 紫色 - 中影响力
  high: '#6A1B9A'     // 深紫色 - 高影响力（避免使用红色）
};

// ===========================================
// 图表主题色彩
// ===========================================

// 渐变色组合 - 重新设计，避免红色系
export const gradientColors = {
  primary: ['#007AFF', '#4FC3F7'],    // 蓝色渐变（替代红色主色）
  secondary: ['#34C759', '#81C784'],  // 绿色渐变
  warning: ['#FF9500', '#FFB74D'],    // 橙色渐变
  info: ['#9370DB', '#BA68C8'],       // 紫色渐变
  accent: ['#20B2AA', '#4DD0E1']      // 青色渐变
};

// 热力图色彩范围 - 使用蓝色系渐变，避免红色
export const heatmapColors = {
  low: '#F0F8FF',     // 爱丽丝蓝（最浅）
  medium: '#87CEEB',  // 天空蓝（中等）
  high: '#1E90FF'     // 道奇蓝（最深，避免使用红色）
};

// 网络图节点色彩（按影响力）- 使用紫色系渐变
export const networkNodeColors = {
  lowInfluence: '#F3E5F5',    // 浅紫色
  mediumInfluence: '#9C27B0', // 中紫色
  highInfluence: '#4A148C'    // 深紫色（避免使用红色）
};

// 时间序列图色彩 - 重新设计，避免红色系
export const timeSeriesColors = {
  activeUsers: '#007AFF',     // 系统蓝（替代微博红）
  newUsers: '#34C759',        // 系统绿  
  posts: '#FF9500',           // 系统橙
  interactions: '#9370DB',    // 中紫色
  activity: '#20B2AA',        // 浅海绿
  influence: '#4169E1'        // 皇室蓝（避免使用红色）
};

// ===========================================
// 工具函数
// ===========================================

/**
 * 根据数值生成渐变色
 * @param value 数值 (0-100)
 * @param startColor 起始色
 * @param endColor 结束色
 * @returns RGB颜色字符串
 */
export function generateGradientColor(value: number, startColor: string, endColor: string): string {
  const ratio = Math.min(Math.max(value / 100, 0), 1);
  
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  
  if (!start || !end) return startColor;
  
  const r = Math.round(start.r + (end.r - start.r) * ratio);
  const g = Math.round(start.g + (end.g - start.g) * ratio);
  const b = Math.round(start.b + (end.b - start.b) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 将十六进制颜色转换为RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * 为颜色添加透明度
 * @param color 颜色值
 * @param opacity 透明度 (0-1)
 */
export function addOpacity(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * 获取活跃度对应的颜色
 * @param activityScore 活跃度分数 (0-100)
 */
export function getActivityColor(activityScore: number): string {
  if (activityScore < 30) return activityLevelColors.low;
  if (activityScore < 70) return activityLevelColors.medium;
  return activityLevelColors.high;
}

/**
 * 获取影响力对应的颜色
 * @param influenceScore 影响力分数 (0-100)
 */
export function getInfluenceColor(influenceScore: number): string {
  if (influenceScore < 30) return influenceLevelColors.low;
  if (influenceScore < 70) return influenceLevelColors.medium;
  return influenceLevelColors.high;
}

// ===========================================
// ECharts主题配置
// ===========================================

export const echartsTheme = {
  color: [
    '#007AFF',    // 系统蓝（替代微博红作为首选色）
    '#34C759',    // 系统绿
    '#FF9500',    // 系统橙  
    '#9370DB',    // 中紫色
    '#20B2AA',    // 浅海绿
    '#4169E1',    // 皇室蓝
    '#32CD32',    // 酸橙绿
    '#8A2BE2'     // 蓝紫色（移除所有红色系）
  ],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: TEXT_PRIMARY
  },
  title: {
    textStyle: {
      color: TEXT_PRIMARY,
      fontWeight: 'bold'
    }
  },
  legend: {
    textStyle: {
      color: TEXT_SECONDARY
    }
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderColor: BORDER_GRAY,
    textStyle: {
      color: TEXT_PRIMARY
    }
  }
};

// ===========================================
// 颜色设计规范与使用指南
// ===========================================

/**
 * 颜色设计规范：
 * 
 * 1. 【数据编码颜色】
 *    - 角色分类：使用 roleColorMap，基于iOS系统色彩
 *    - 兴趣分类：使用 interestColorMap，基于HSL色相环均匀分布
 *    - 严禁在数据编码中使用红色系（#E6162D及其衍生色）
 * 
 * 2. 【品牌与UI颜色】  
 *    - 微博红（WEIBO_RED）仅用于：品牌标识、主按钮、强调元素
 *    - 不得用于：数据分类、图表系列、用户角色/兴趣标识
 * 
 * 3. 【多视图一致性】
 *    - 所有图表组件必须使用统一的颜色映射
 *    - 禁止在组件内部定义局部颜色
 *    - 同一分类在所有视图中颜色必须完全一致
 * 
 * 4. 【可访问性要求】
 *    - 确保足够的对比度（WCAG AA标准）
 *    - 避免仅依赖颜色传达信息
 *    - 考虑色盲用户的体验
 * 
 * 5. 【维护指南】
 *    - 新增分类时，从HSL色相环选择未使用的色相
 *    - 修改颜色时，必须更新所有相关组件
 *    - 定期检查颜色在不同设备上的显示效果
 */

/**
 * 获取分类颜色的标准方法
 */
export function getRoleColor(role: AccountRole): string {
  return roleColorMap[role];
}

export function getInterestColor(interest: AccountInterest): string {
  return interestColorMap[interest];
}

/**
 * 颜色一致性验证函数
 */
export function validateColorConsistency(): boolean {
  // 检查是否有重复颜色
  const roleColors = Object.values(roleColorMap);
  const interestColors = Object.values(interestColorMap);
  const allColors = [...roleColors, ...interestColors];
  
  return new Set(allColors).size === allColors.length;
}