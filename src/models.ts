export type MediaPlatform = 'weibo' | 'twitter' | 'rednote';

export const mediaPlatforms = ['weibo', 'twitter', 'rednote'] as MediaPlatform[];

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
    'travel'  // 旅游

export const accountInterests = ['animals', 'arts and culture', 'business and finance', 'entertainment', 'fashion and beauty', 'fitness and health', 'food and dining', 'learning and educational', 'politics', 'science and technology', 'sports', 'travel'] as AccountInterest[];

// 账号类型分为 分非活跃用户 寻求信息用户 信息源用户 大众用户
export type AccountRole = 'inactive' | 'information-seeker' | 'information-source' | 'general';

export const accountRoles = ['inactive', 'information-seeker', 'information-source', 'general'] as AccountRole[];


export type AccountNodePK = ({
  type: 'role'
  key: AccountRole
} | {
  type: 'platform'
  key: MediaPlatform
} | {
  type: 'interest'
  key: AccountInterest
})

export type AccountStatsNode =
    AccountNodePK & {
  id: string // => `${type}/${key}`
  size: number // 节点大小
}

export type AccountStatsLink = {
  node1: string
  node2: string
  size: number // 关联大小
}