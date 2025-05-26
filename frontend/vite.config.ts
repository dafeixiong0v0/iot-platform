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
    port: 3088, // 开发服务器端口 (Development server port)
    proxy: {
      // API请求代理配置
      // API request proxy configuration

      // 代理 /Device 路径的请求到后端服务器
      // Proxy requests for the /Device path to the backend server
      '/api': { 
        target: 'http://192.168.1.80:9981/', // 后端服务器地址 (Backend server address)
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
        secure: false,
      },
      // // 代理 /People 路径的请求到后端服务器
      // // Proxy requests for the /People path to the backend server
      // '/People': { 
      //   target: 'http://localhost:9981', // 后端服务器地址 (Backend server address)
      //   changeOrigin: true, // 需要虚拟主机站点 (Virtual host site required)
      // },
      // // 代理 /Record 路径的请求到后端服务器
      // // Proxy requests for the /Record path to the backend server
      // '/Record': { 
      //   target: 'http://localhost:9981', // 后端服务器地址 (Backend server address)
      //   changeOrigin: true, // 需要虚拟主机站点 (Virtual host site required)
      // }
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
