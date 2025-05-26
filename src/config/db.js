// src/config/db.js
// 数据库连接模块

const mongoose = require('mongoose');

// 从环境变量中获取 MongoDB 连接 URI
// 在 docker-compose.yml 中，这将是 'mongodb://mongo_db:27017/iot_platform'
// (Get MongoDB connection URI from environment variables)
// (In docker-compose.yml, this will be 'mongodb://mongo_db:27017/iot_platform')
const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/iot_platform_dev'; // 提供一个本地开发备选项 (Provide a local development fallback)

/**
 * 连接到 MongoDB 数据库
 * (Connect to MongoDB database)
 * @async
 */
const connectDB = async () => {
  try {
    // mongoose.connect 返回一个 Promise
    // (mongoose.connect returns a Promise)
    await mongoose.connect(dbURI, {
      // 新版 Mongoose (v6+) 不再需要很多旧的选项，如 useNewUrlParser, useUnifiedTopology 等
      // (Newer Mongoose (v6+) no longer requires many old options like useNewUrlParser, useUnifiedTopology, etc.)
      // 但可以设置其他选项，例如服务器选择超时时间
      // (But other options can be set, e.g., server selection timeout)
      serverSelectionTimeoutMS: 5000 // 5秒内选定服务器，否则超时 (Select server within 5 seconds, otherwise timeout)
    });
    console.log('MongoDB 数据库连接成功! (MongoDB connected successfully!)');
    console.log(`连接到 (Connected to): ${dbURI}`);

    // 监听连接错误事件 (连接成功之后)
    // (Listen for connection error events (after successful connection))
    mongoose.connection.on('error', err => {
      console.error('MongoDB 连接错误 (MongoDB connection error after initial connection):', err);
    });

    // 监听断开连接事件
    // (Listen for disconnection events)
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 连接已断开 (MongoDB disconnected)');
    });

  } catch (err) {
    // 初始连接错误
    // (Initial connection error)
    console.error('MongoDB 初始连接失败 (Failed to connect to MongoDB initially):', err.message);
    // 可以在这里决定是否因为数据库连接失败而退出应用
    // (Can decide here whether to exit the application due to database connection failure)
    // process.exit(1); // 如果数据库是关键依赖，可以选择退出 (If the database is a critical dependency, can choose to exit)
  }
};

module.exports = connectDB;
