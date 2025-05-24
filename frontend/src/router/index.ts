// frontend/src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue' // 示例视图 (Example View)

// 定义路由规则
// Define routing rules
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home', // 首页 (Home Page)
    component: HomeView
  },
  {
    path: '/devices',
    name: 'devices', // 设备管理 (Device Management) (占位 - Placeholder)
    // 路由懒加载示例
    // Route lazy loading example
    component: () => import(/* webpackChunkName: "devices" */ '../views/DeviceManagementView.vue')
  },
  {
    path: '/people',
    name: 'people', // 人员管理 (People Management)
    // 路由懒加载
    // Route lazy loading
    component: () => import(/* webpackChunkName: "people" */ '../views/PeopleManagementView.vue')
  },
  {
    path: '/records',
    name: 'records', // 记录查看 (Record Viewing)
    // 路由懒加载
    // Route lazy loading
    component: () => import(/* webpackChunkName: "records" */ '../views/RecordViewingView.vue')
  }
  // 更多路由可以在此定义
  // More routes can be defined here
]

// 创建路由实例
// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // 使用HTML5 History模式 (Use HTML5 History mode)
  routes
})

// 导出路由实例
// Export router instance
export default router
