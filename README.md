# 微博社交媒体用户行为分析可视化系统

一个专业的多视图可视化分析平台，专注于微博用户行为模式分析与数据洞察。

## 🚀 系统特色

### 📊 多维度可视化分析
- **时间序列分析** - 展示用户活跃度、发帖数、互动数等随时间变化趋势
- **散点图分析** - 分析用户活跃度与影响力关系，支持框选和分类查看
- **活跃度热力图** - 以小时×星期维度展示用户活跃模式，识别最佳发布时机
- **分布饼图** - 展示用户角色占比与兴趣分类分布，支持交互筛选

### 🎯 智能筛选与联动
- **多维度筛选** - 时间范围、活跃度、影响力、用户角色、兴趣分类
- **跨视图联动** - 任一视图的筛选操作实时更新所有相关视图
- **交互历史** - 记录用户操作历史，支持状态回退
- **快捷筛选** - 预设常用时间范围和筛选条件

### 🎨 专业视觉设计
- **微博红主色调** - 采用微博官方红色 #E6162D 作为主要品牌色
- **响应式布局** - 完美适配桌面端、平板和移动设备
- **现代化UI** - 卡片式设计，流畅的交互动画
- **可视化主题** - 统一的图表配色和样式规范

## 🏗️ 技术架构

### 前端技术栈
- **Vue 3** - 组合式API，响应式框架
- **TypeScript** - 类型安全的JavaScript超集
- **Pinia** - 现代化状态管理
- **Element Plus** - 企业级UI组件库
- **ECharts** - 专业图表可视化库
- **Vite** - 快速构建工具

### 核心架构设计
```
src/
├── components/          # 可复用组件
│   ├── charts/         # 图表组件
│   │   ├── TimeSeriesChart.vue    # 时间序列图
│   │   ├── ScatterChart.vue       # 散点图
│   │   ├── HeatmapChart.vue       # 热力图
│   │   └── PieChart.vue          # 饼图
│   ├── FilterPanel.vue          # 筛选面板
│   └── ViewCard.vue             # 视图容器
├── stores/             # 状态管理
│   └── index.ts       # 主要分析状态
├── pages/             # 页面组件
│   ├── HomePage.vue    # 首页
│   └── AnalysisDashboard.vue  # 分析仪表板
├── models.ts          # 数据类型定义
└── util/
    └── colors.ts      # 颜色配置
```

## 📈 数据模型

### 用户分类体系
**角色分类（4类）**
- 非活跃用户 - 较少参与平台活动
- 信息搜索者 - 主要消费内容的用户
- 信息源 - 主要生产内容的用户  
- 一般用户 - 均衡参与的用户

**兴趣分类（12类）**
- 动物、艺术文化、商业金融、娱乐
- 时尚美容、健身健康、美食餐饮、学习教育
- 政治、科技、体育、旅游

### 核心数据结构
```typescript
// 用户基础信息
interface UserProfile {
  userId: string
  role: AccountRole
  interests: AccountInterest[]
  registrationDate: string
  location?: string
}

// 用户行为数据
interface UserBehaviorData {
  userId: string
  activityScore: number    // 活跃度分数 (0-100)
  influenceScore: number   // 影响力分数 (0-100)
  postCount: number        // 发帖数
  interactionCount: number // 互动数
  followerCount: number    // 粉丝数
  followingCount: number   // 关注数
  lastActiveDate: string
}
```

## 🎮 主要功能

### 1. 时间序列分析
- **多指标切换** - 活跃用户数、新增用户数、发帖数、互动数
- **时间粒度** - 支持小时、天、周、月级别聚合
- **区间选择** - 支持拖拽选择时间范围进行深入分析
- **趋势洞察** - 自动识别增长趋势和异常波动

### 2. 散点图分析  
- **双维度展示** - X轴活跃度，Y轴影响力
- **分类着色** - 可按用户角色或兴趣分类着色
- **框选功能** - 支持矩形、多边形框选用户群体
- **数据导出** - 选中用户数据可导出为CSV格式

### 3. 活跃度热力图
- **时间模式** - 24小时×7天的活跃度分布热力图
- **多指标** - 活跃度值、用户数量、发帖数量
- **时段洞察** - 点击查看具体时段的详细数据
- **最佳时机** - 自动推荐最佳内容发布时间

### 4. 用户分布分析
- **角色分布** - 展示4类用户角色的占比情况
- **兴趣分布** - 展示12类兴趣标签的分布
- **图表样式** - 支持环形图、饼图、玫瑰图三种样式
- **交互筛选** - 点击扇区进行快速筛选

### 5. 智能筛选系统
- **时间筛选** - 快捷时间范围 + 自定义日期选择
- **范围筛选** - 活跃度和影响力的滑动范围选择  
- **分类筛选** - 用户角色和兴趣的多选标签
- **实时联动** - 筛选条件变更时所有视图实时更新

### 6. 数据导入
- **CSV上传** - 支持通过仪表板顶部按钮上传用户数据CSV文件
- **测试文件生成** - 上传后自动生成并下载一份test-upload.csv测试文件

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- pnpm >= 7.0.0 (推荐) 或 npm >= 8.0.0

### 安装依赖
```bash
# 使用 pnpm (推荐)
  pnpm install

# 或使用 npm
npm install
```

### 开发服务器
```bash
# 启动开发服务器
pnpm dev

# 或使用 npm
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本
```bash
# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

## 🎯 使用指南

### 1. 首页导航
- 系统功能介绍和特色展示
- 分析维度说明（用户角色、兴趣分类）
- 一键进入分析仪表板

### 2. 仪表板操作
1. **查看统计概览** - 顶部卡片展示关键指标
2. **设置筛选条件** - 使用筛选面板设定分析范围
3. **多视图分析** - 在不同图表间切换查看数据
4. **交互式探索** - 点击、框选、悬停获取详细信息
5. **导出分析结果** - 支持图表截图和数据导出
6. **导入数据** - 点击右上角“导入CSV”按钮，上传用户数据CSV文件，系统将自动解析并生成一份test-upload.csv测试文件下载

### 3. 视图切换
- **显示/隐藏视图** - 点击视图标题栏的眼睛图标
- **全屏查看** - 点击放大图标进入全屏模式
- **导出图表** - 点击下载图标保存为PNG格式
- **视图说明** - 点击问号图标查看使用帮助

## 🔧 系统配置

### 颜色主题定制
```typescript
// src/util/colors.ts
export const WEIBO_RED = '#E6162D'
export const interestColorMap = {
  // 12种兴趣分类的专属颜色
}
export const roleColorMap = {
  // 4种用户角色的专属颜色  
}
```

### 数据接口对接
```typescript
// src/stores/index.ts
async function loadData() {
  // 替换为实际的API调用
  const response = await fetch('/api/user-analytics')
  const data = await response.json()
  // 更新状态
}
```

## 📱 响应式设计

### 桌面端 (>1200px)
- 2-3列网格布局
- 完整的筛选面板和统计卡片
- 所有交互功能完全可用

### 平板端 (768px-1200px)  
- 2列网格布局
- 可折叠的筛选面板
- 适配触摸操作

### 移动端 (<768px)
- 单列堆叠布局
- 简化的交互控件
- 优化的触摸体验

## 🎨 设计规范

### 视觉层次
- **主色调**: 微博红 #E6162D
- **辅助色**: 中性灰 #8A8E99, 浅蓝 #4A90E2  
- **背景色**: 浅灰 #F7F8FA
- **文本色**: 深灰 #1D2129, 中灰 #4E5969

### 组件规范
- **卡片阴影**: 0 2px 8px rgba(0,0,0,0.06)
- **圆角大小**: 8px (小组件) / 12px (大容器)
- **间距单位**: 0.5rem, 1rem, 1.5rem, 2rem
- **字体大小**: 0.875rem, 1rem, 1.1rem, 1.25rem

## 🔮 未来规划

### 即将推出
- **关系网络分析** - 用户互动关系的力导向图
- **词云分析** - 热门关键词趋势分析
- **地域分布** - 基于地理位置的用户分布地图
- **交互历史** - 操作历史记录和状态回退

### 高级功能
- **自定义仪表板** - 用户可自定义视图布局
- **数据导入导出** - 支持多种格式的数据交换
- **报告生成** - 自动生成分析报告和PPT
- **实时数据** - WebSocket实时数据更新

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

🎯 **专业的微博用户行为分析，从这里开始**