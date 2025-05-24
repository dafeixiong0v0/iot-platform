// 导入 Express 应用实例
// Import the Express app instance
const app = require('./app');

// 定义服务器监听的端口
// Define the port for the server to listen on
const PORT = process.env.PORT || 3000;

// 启动服务器
// Start the server
app.listen(PORT, () => {
  // 服务器启动成功后，在控制台输出提示信息
  // After the server starts successfully, output a message to the console
  console.log(`服务器正在运行在端口 (Server is running on port) ${PORT}`);
  console.log(`访问 (Access via): http://localhost:${PORT}`);
});
