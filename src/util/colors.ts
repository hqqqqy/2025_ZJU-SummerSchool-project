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

// 兴趣分类色彩映射（12类）
export const interestColorMap: Record<AccountInterest, string> = {
  'animals': '#FF6B6B',           // 温暖红色
  'arts and culture': '#4ECDC4',  // 青色
  'business and finance': '#45B7D1', // 蓝色
  'entertainment': '#96CEB4',     // 薄荷绿
  'fashion and beauty': '#FFEAA7', // 浅黄色
  'fitness and health': '#DDA0DD', // 淡紫色
  'food and dining': '#FD79A8',   // 粉红色
  'learning and educational': '#6C5CE7', // 紫色
  'politics': '#A29BFE',          // 浅紫色
  'science and technology': '#74B9FF', // 天蓝色
  'sports': '#55A3FF',            // 蓝色系
  'travel': '#FD95A8'             // 玫瑰色
};

// 角色分类色彩映射（4类）
export const roleColorMap: Record<AccountRole, string> = {
  'inactive': '#BDC3C7',          // 灰色 - 非活跃
  'information-seeker': '#3498DB', // 蓝色 - 信息搜索者
  'information-source': WEIBO_RED, // 微博红 - 信息源
  'general': '#2ECC71'            // 绿色 - 一般用户
};

// 活跃度等级色彩
export const activityLevelColors = {
  low: '#95A5A6',     // 灰色
  medium: '#F39C12',  // 橙色
  high: WEIBO_RED     // 微博红
};

// 影响力等级色彩
export const influenceLevelColors = {
  low: '#BDC3C7',     // 浅灰
  medium: '#9B59B6',  // 紫色
  high: '#E74C3C'     // 红色
};

// ===========================================
// 图表主题色彩
// ===========================================

// 渐变色组合
export const gradientColors = {
  primary: [WEIBO_RED, '#FF4757'],
  secondary: [LIGHT_BLUE, '#74B9FF'],
  success: ['#2ECC71', '#55E384'],
  warning: ['#F39C12', '#F8C471'],
  info: ['#3498DB', '#85C1E9']
};

// 热力图色彩范围
export const heatmapColors = {
  low: '#FFF5F5',     // 最浅
  medium: '#FFCDD2',  // 中等
  high: WEIBO_RED     // 最深
};

// 网络图节点色彩（按影响力）
export const networkNodeColors = {
  lowInfluence: '#E8F4FD',
  mediumInfluence: '#74B9FF',
  highInfluence: WEIBO_RED
};

// 时间序列图色彩
export const timeSeriesColors = {
  activeUsers: WEIBO_RED,
  newUsers: LIGHT_BLUE,
  posts: '#2ECC71',
  interactions: '#9B59B6',
  activity: '#F39C12',
  influence: '#E74C3C'
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
    WEIBO_RED,
    LIGHT_BLUE,
    '#2ECC71',
    '#9B59B6',
    '#F39C12',
    '#E74C3C',
    '#1ABC9C',
    '#34495E'
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