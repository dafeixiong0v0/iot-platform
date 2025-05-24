// 导入 Express 框架
const express = require('express');

// 创建 Express 应用实例
const app = express();

// 中间件: 解析 JSON 格式的请求体
// This allows the application to accept JSON data in request bodies.
// 允许应用接收请求体中的JSON数据
app.use(express.json());

// 根路由 (可选，用于测试服务器是否运行)
// Optional root route to test if the server is running
app.get('/', (req, res) => {
  res.send('IoT Platform Server is running!');
});

// 导入设备相关的路由模块
// Import device-related route modules
const deviceRoutes = require('./api/deviceRoutes');

// 挂载设备路由
// Mount device routes
// 所有 /Device 下的路径都将由 deviceRoutes 处理
// All paths under /Device will be handled by deviceRoutes
app.use('/Device', deviceRoutes);

// 导入人员相关的路由模块
// Import people-related route modules
const peopleRoutes = require('./api/peopleRoutes');

// 挂载人员路由
// Mount people routes
// 所有 /People 下的路径都将由 peopleRoutes 处理
// All paths under /People will be handled by peopleRoutes
app.use('/People', peopleRoutes);

// TODO: 在后续步骤中，这里将挂载其他路由模块 (例如系统记录、识别记录等)
// In later steps, other route modules will be mounted here (e.g., system records, identification records, etc.).

// 导出 Express 应用实例，以便在 server.js 中使用
// Export the Express app instance for use in server.js
module.exports = app;
