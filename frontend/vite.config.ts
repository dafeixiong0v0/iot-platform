// frontend/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
// 导出Vite配置
// Export Vite configuration
export default defineConfig({
  plugins: [vue()], // 使用Vue插件 (Use Vue plugin)
  server: {
    // 开发服务器配置
    // Development server configuration
    proxy: {
      // API请求代理配置
      // API request proxy configuration

      // 代理 /Device 路径的请求到后端服务器
      // Proxy requests for the /Device path to the backend server
      '/Device': { 
        target: 'http://localhost:3000', // 后端服务器地址 (Backend server address)
        changeOrigin: true, // 需要虚拟主机站点 (Virtual host site required)
        // rewrite: (path) => path.replace(/^\/api\/v2/, '') // 如果后端API路径与前端请求路径不完全一致，可能需要重写 (If backend API path doesn't exactly match frontend request path, rewrite might be needed)
      },
      // 代理 /People 路径的请求到后端服务器
      // Proxy requests for the /People path to the backend server
      '/People': { 
        target: 'http://localhost:3000', // 后端服务器地址 (Backend server address)
        changeOrigin: true, // 需要虚拟主机站点 (Virtual host site required)
      },
      // 代理 /Record 路径的请求到后端服务器
      // Proxy requests for the /Record path to the backend server
      '/Record': { 
        target: 'http://localhost:3000', // 后端服务器地址 (Backend server address)
        changeOrigin: true, // 需要虚拟主机站点 (Virtual host site required)
      }
      // 示例：如果所有API都在 /api 前缀下
      // Example: If all APIs are under the /api prefix
      // '/api': {
      //   target: 'http://localhost:3000', // 后端服务器地址
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '') // 移除 /api 前缀
      // }
    }
  }
})
