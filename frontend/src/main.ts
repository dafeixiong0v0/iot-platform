// frontend/src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 我们将创建这个文件 (We will create this file)
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css' // Vite default styles

// 创建Vue应用实例
// Create Vue application instance
const app = createApp(App)

// 使用Vue Router
// Use Vue Router
app.use(router)
// 使用Element Plus UI库
// Use Element Plus UI library
app.use(ElementPlus)

// 挂载应用
// Mount the application
app.mount('#app')
