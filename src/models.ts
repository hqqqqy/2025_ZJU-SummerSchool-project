// ===========================================
// 微博社交媒体用户行为分析数据模型定义
// ===========================================

// 媒体平台类型（专注于微博）
export type MediaPlatform = 'weibo';

// 用户角色分类（4类）
export type AccountRole = 'inactive' | 'information-seeker' | 'information-source' | 'general';

export const accountRoles = ['inactive', 'information-seeker', 'information-source', 'general'] as AccountRole[];

// 用户兴趣分类（12类）
export type AccountInterest =
    'animals' | // 动物
    'arts and culture' | // 艺术文化
    'business and finance' | // 商业金融
    'entertainment' | // 娱乐
    'fashion and beauty' | // 时尚美容
    'fitness and health' | // 健身健康
    'food and dining' | // 美食餐饮
    'learning and educational' | // 学习教育
    'politics' | // 政治
    'science and technology' | // 科技
    'sports' | // 体育
    'travel';  // 旅游

export const accountInterests = ['animals', 'arts and culture', 'business and finance', 'entertainment', 'fashion and beauty', 'fitness and health', 'food and dining', 'learning and educational', 'politics', 'science and technology', 'sports', 'travel'] as AccountInterest[];

// 用户活跃度等级
export type ActivityLevel = 'low' | 'medium' | 'high';

// 用户影响力等级
export type InfluenceLevel = 'low' | 'medium' | 'high';

// ===========================================
// 核心数据结构定义
// ===========================================

// 用户基础信息
export interface UserProfile {
    userId: string;
    role: AccountRole;
    interests: AccountInterest[];
    registrationDate: string; // ISO 8601 date string
    location?: string; // 地理位置信息
}

// 用户行为数据
export interface UserBehaviorData {
    userId: string;
    activityScore: number; // 活跃度分数 (0-100)
    influenceScore: number; // 影响力分数 (0-100)
    postCount: number; // 发帖数
    interactionCount: number; // 互动数（点赞、评论、转发等）
    followerCount: number; // 粉丝数
    followingCount: number; // 关注数
    lastActiveDate: string; // ISO 8601 date string
}

// 时间序列数据点
export interface TimeSeriesDataPoint {
    timestamp: string; // ISO 8601 datetime string
    activeUserCount: number; // 活跃用户数
    newUserCount: number; // 新增用户数
    postCount: number; // 发帖数
    interactionCount: number; // 互动数
    avgActivityScore: number; // 平均活跃度
    avgInfluenceScore: number; // 平均影响力
}

// 热力图数据结构（小时 × 星期）
export interface HeatmapDataPoint {
    hour: number; // 0-23
    dayOfWeek: number; // 0-6 (Sunday=0)
    value: number; // 活跃度值
    userCount: number; // 该时段活跃用户数
    postCount: number; // 该时段发帖数
}

// 散点图数据点
export interface ScatterDataPoint {
    userId: string;
    activityScore: number;
    influenceScore: number;
    role: AccountRole;
    interests: AccountInterest[];
    postCount: number;
    interactionCount: number;
}

// 网络关系数据
export interface NetworkNode {
    id: string; // userId
    activityScore: number;
    influenceScore: number;
    role: AccountRole;
    primaryInterest: AccountInterest;
    size: number; // 节点大小（基于影响力）
}

export interface NetworkEdge {
    source: string; // source userId
    target: string; // target userId
    weight: number; // 互动频率/强度
    interactionType: 'follow' | 'like' | 'comment' | 'repost';
}

// 词云数据
export interface WordCloudItem {
    text: string;
    value: number; // 词频
    relatedUserIds: string[]; // 相关联的用户ID
}

// 地域分布数据
export interface GeographicDataPoint {
    region: string; // 地区名称
    latitude: number;
    longitude: number;
    userCount: number;
    avgActivityScore: number;
    avgInfluenceScore: number;
    roleDistribution: Record<AccountRole, number>;
    interestDistribution: Record<AccountInterest, number>;
}

// ===========================================
// 筛选和聚合相关类型
// ===========================================

// 筛选条件
export interface FilterCondition {
    // 时间范围
    dateRange?: {
        start: string; // ISO 8601 date
        end: string; // ISO 8601 date
    };
    // 活跃度范围
    activityRange?: {
        min: number; // 0-100
        max: number; // 0-100
    };
    // 影响力范围
    influenceRange?: {
        min: number; // 0-100
        max: number; // 0-100
    };
    // 角色筛选
    roles?: AccountRole[];
    // 兴趣筛选
    interests?: AccountInterest[];
    // 地区筛选
    regions?: string[];
    // 用户ID筛选（用于特定用户分析）
    userIds?: string[];
}

// 统计聚合数据
export interface AggregatedStats {
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalInteractions: number;
    avgActivityScore: number;
    avgInfluenceScore: number;
    roleDistribution: Record<AccountRole, number>;
    interestDistribution: Record<AccountInterest, number>;
}

// ===========================================
// 交互和UI状态类型
// ===========================================

// 视图类型
export type ViewType = 'timeSeries' | 'scatter' | 'heatmap' | 'pieChart' | 'network' | 'wordcloud' | 'geographic';

// 选中状态
export interface SelectionState {
    selectedUserIds: string[];
    selectedRole?: AccountRole;
    selectedInterest?: AccountInterest;
    selectedRegion?: string;
    selectedTimeRange?: {
        start: string;
        end: string;
    };
}

// 交互操作记录
export interface InteractionRecord {
    id: string;
    timestamp: string;
    action: 'filter' | 'select' | 'highlight' | 'zoom';
    viewType: ViewType;
    description: string;
    filterCondition?: FilterCondition;
    selectionState?: SelectionState;
}

// 视图配置
export interface ViewConfig {
    viewType: ViewType;
    title: string;
    isVisible: boolean;
    position: { x: number; y: number; width: number; height: number };
    config: Record<string, any>; // 视图特定配置
}

// ===========================================
// API响应类型（用于与后端对接）
// ===========================================

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
}

// 数据查询请求
export interface DataQueryRequest {
    filterCondition: FilterCondition;
    aggregationLevel: 'hour' | 'day' | 'week' | 'month';
    includeDetails: boolean;
}

// 批量数据响应
export interface BatchDataResponse {
    userProfiles: UserProfile[];
    userBehaviors: UserBehaviorData[];
    timeSeriesData: TimeSeriesDataPoint[];
    heatmapData: HeatmapDataPoint[];
    scatterData: ScatterDataPoint[];
    networkNodes: NetworkNode[];
    networkEdges: NetworkEdge[];
    wordCloudData: WordCloudItem[];
    geographicData: GeographicDataPoint[];
    aggregatedStats: AggregatedStats;
}