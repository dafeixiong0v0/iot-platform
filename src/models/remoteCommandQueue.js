/**
 * @typedef {object} RemoteCommandQueue
 * @property {string} deviceSN - 设备序列号，目标设备，需要索引
 * @property {string} commandType - 命令类型 (例如: 'Restart', 'Opendoor', 'SyncParameter', 'AddPeople', 'DeletePeople', 'PushSoftware')
 * @property {object} commandPayload - 命令参数，根据命令类型不同结构也不同
 * @property {string} status - 命令状态 (例如: 'Pending', 'Sent', 'Acknowledged', 'Failed')
 * @property {number} [priority] - 命令优先级 (可选)
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 * @property {number} [maxRetries=3] - 最大重试次数 (可选, 默认为3)
 * @property {number} [retryCount=0] - 当前重试次数 (可选, 默认为0)
 */

// Note: This file only contains JSDoc comments for schema definition.
// Actual Mongoose schema will be implemented later.
