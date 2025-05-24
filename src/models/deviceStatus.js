/**
 * @typedef {object} DeviceStatus
 * @property {string} deviceSN - 设备的序列号，关联到Device集合，需要索引
 * @property {boolean} onlineStatus - 在线状态 (true: 在线, false: 离线)
 * @property {Date} lastKeepaliveAt - 最后心跳时间
 * @property {number} relayStatus - 继电器状态 (例如: 0: 关闭, 1: 开启)
 * @property {number} keepOpenStatus - 常开状态 (例如: 0: 关闭, 1: 开启)
 * @property {number} doorSensorStatus - 门磁状态 (例如: 0: 关闭, 1: 开启)
 * @property {number} lockDoorStatus - 门锁状态 (例如: 0: 未锁, 1: 已锁)
 * @property {string} alarmStatus - 报警状态 (例如: "no_alarm", "sensor_alarm", "tamper_alarm")
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

// Note: This file only contains JSDoc comments for schema definition.
// Actual Mongoose schema will be implemented later.
