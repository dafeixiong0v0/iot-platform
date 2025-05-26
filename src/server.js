// src/server.js
const app = require('./app');
const connectDB = require('./config/db'); // 导入数据库连接模块 (Import database connection module)

// 定义端口号，优先从环境变量获取，否则默认为 3000
// Define port number, preferentially from environment variables, otherwise default to 3000
const PORT = process.env.PORT || 3000;

/**
 * 启动服务器的主函数
 * (Main function to start the server)
 * @async
 */
const startServer = async () => {
  // 首先连接到数据库
  // First, connect to the database
  await connectDB();

  // 数据库连接成功后 (或尝试连接后)，启动 Express 应用服务器
  // After successful database connection (or connection attempt), start the Express application server
  app.listen(9981, () => {
    console.log(`后端服务运行在 http://localhost:${9981} (Backend server running on http://localhost:${9981})`);
    console.log('所有API路由已在 src/app.js 中配置，并通过各自的路由文件 (例如 src/api/deviceRoutes.js) 实现。 (All API routes are configured in src/app.js and implemented through their respective route files (e.g., src/api/deviceRoutes.js).)');
    console.log('要测试心跳接口，请发送 POST 请求到 /Device/Keepalive (To test the keepalive endpoint, send a POST request to /Device/Keepalive)');
  });
};

// 调用启动服务器函数
// Call the function to start the server
startServer();
