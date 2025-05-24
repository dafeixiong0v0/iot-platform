// src/models/remoteCommandQueue.js
const mongoose = require('mongoose');

/**
 * JSDoc for reference, Mongoose schema is the source of truth
 * @typedef {object} RemoteCommandQueue
 * @property {string} deviceSN - 设备序列号，目标设备，需要索引
 * @property {string} commandType - 命令类型 (例如: 'Restart', 'Opendoor', 'SyncParameter', 'AddPeople', 'DeletePeople', 'PushSoftware')
 * @property {object} commandPayload - 命令参数，根据命令类型不同结构也不同
 * @property {string} status - 命令状态 (例如: 'Pending', 'Sent', 'Acknowledged', 'Failed', 'Processing')
 * @property {number} [priority=0] - 命令优先级 (数值越大代表越高，或约定其他规则)
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 * @property {number} [maxRetries=3] - 最大重试次数
 * @property {number} [retryCount=0] - 当前重试次数
 * @property {Date} [lastAttemptAt] - 上次尝试发送时间 (用于处理重试间隔)
 * @property {string} [errorMessage] - 如果失败，记录错误信息
 */

// 远程命令队列 Schema
// (Remote Command Queue Schema)
const remoteCommandQueueSchema = new mongoose.Schema({
  deviceSN: { // 设备序列号，目标设备 (Device Serial Number, target device)
    type: String,
    required: true, // 必须字段 (Required field)
    index: true     // 建立索引以提高查询效率 (Create index to improve query efficiency)
  },
  commandType: { // 命令类型 (Command Type - e.g., 'Restart', 'Opendoor', 'SyncParameter')
    type: String,
    required: true // 必须字段 (Required field)
  },
  commandPayload: { // 命令参数，结构随 commandType 变化 (Command Payload - structure varies with commandType)
    type: mongoose.Schema.Types.Mixed // 使用 Mixed 类型存储任意结构的JSON对象 (Use Mixed type to store JSON objects of any structure)
  },
  status: { // 命令状态 (Command Status)
    type: String,
    required: true, // 必须字段 (Required field)
    enum: ['Pending', 'Sent', 'Acknowledged', 'Failed', 'Processing'], // 枚举值: 待处理, 已发送, 已确认, 处理失败, 处理中 (Enum values: Pending, Sent, Acknowledged, Failed, Processing)
    default: 'Pending' // 默认状态为待处理 (Default status is Pending)
  },
  priority: { // 命令优先级 (数值越大/越小代表越高，约定一个规则) (Command Priority - larger/smaller value means higher priority, agree on a rule)
    type: Number,
    default: 0,    // 默认优先级为0 (Default priority is 0)
    index: true    // 建立索引以支持按优先级查询 (Create index to support querying by priority)
  },
  maxRetries: { // 最大重试次数 (Maximum Retry Attempts)
    type: Number,
    default: 3     // 默认最大重试次数为3 (Default maximum retry attempts is 3)
  },
  retryCount: { // 当前重试次数 (Current Retry Count)
    type: Number,
    default: 0     // 默认当前重试次数为0 (Default current retry count is 0)
  },
  lastAttemptAt: { // 上次尝试发送时间 (用于处理重试间隔) (Last Attempt Time - for handling retry intervals)
    type: Date 
  },
  errorMessage: { // 如果失败，记录错误信息 (If failed, record error message)
    type: String 
  },
  // createdAt 和 updatedAt 会由 timestamps: true 自动管理
  // (createdAt and updatedAt will be automatically managed by timestamps: true)
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段 (Automatically add createdAt and updatedAt fields)
});

// 导出 RemoteCommandQueue 模型
// (Export RemoteCommandQueue model)
module.exports = mongoose.model('RemoteCommandQueue', remoteCommandQueueSchema);
