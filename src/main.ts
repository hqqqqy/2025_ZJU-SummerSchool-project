import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VChart from 'vue-echarts'

import App from './App.vue'
import { router } from './router'

const app = createApp(App)
const pinia = createPinia()

// 注册Pinia状态管理
app.use(pinia)

// 注册路由
app.use(router)

// 注册Element Plus
app.use(ElementPlus)

// 注册ECharts组件
app.component('VChart', VChart)

app.mount('#app')
