import { createRouter, createWebHistory } from 'vue-router'

import AnalysisDashboard from './pages/AnalysisDashboard.vue'

const routes = [
    { 
        path: '/', 
        name: 'dashboard',
        component: AnalysisDashboard 
    },
    // 重定向到分析仪表板
    { 
        path: '/:pathMatch(.*)*', 
        redirect: '/' 
    }
]

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})