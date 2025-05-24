// src/models/deviceStatus.js
const mongoose = require('mongoose');

/**
 * @typedef {object} DeviceStatus JSDoc for reference, Mongoose schema is the source of truth
 * @property {string} deviceSN - 设备的序列号，关联到Device集合，需要索引
 * @property {boolean} onlineStatus - 在线状态 (true: 在线, false: 离线)
 * @property {Date} lastKeepaliveAt - 最后心跳时间
 * @property {string} [ipAddress] - 设备当前上报的IP地址 (可能动态变化)
 * @property {number} relayStatus - 继电器状态 (例如: 0: 关闭, 1: 开启)
 * @property {number} keepOpenStatus - 常开状态 (例如: 0: 关闭, 1: 开启)
 * @property {number} doorSensorStatus - 门磁状态 (例如: 0: 关闭, 1: 开启)
 * @property {number} lockDoorStatus - 门锁状态 (例如: 0: 未锁, 1: 已锁)
 * @property {string} alarmStatus - 报警状态 (例如: "no_alarm", "sensor_alarm", "tamper_alarm")
 * @property {Date} createdAt - 创建时间 (由Mongoose自动管理)
 * @property {Date} updatedAt - 更新时间 (由Mongoose自动管理)
 */

// 设备状态 Schema
// (Device Status Schema)
const deviceStatusSchema = new mongoose.Schema({
  deviceSN: { // 设备序列号，关联到Device集合 (Device Serial Number, related to Device collection)
    type: String,
    required: true, // 必须字段 (Required field)
    unique: true,   // 唯一索引 (Unique index)
    index: true     // 建立索引以提高查询效率 (Create index to improve query efficiency)
  },
  onlineStatus: { // 在线状态 (Online Status)
    type: Boolean,
    default: false  // 默认为离线 (Defaults to offline)
  },
  lastKeepaliveAt: { // 最后心跳时间 (Last Keepalive Time)
    type: Date 
  },
  ipAddress: { // 设备当前上报的IP地址 (Current IP address reported by the device)
    type: String
  },
  relayStatus: { // 继电器状态 (Relay Status - e.g., 0: Off, 1: On)
    type: Number 
  },
  keepOpenStatus: { // 常开状态 (Keep Open Status - e.g., 0: Off, 1: On)
    type: Number 
  },
  doorSensorStatus: { // 门磁状态 (Door Sensor Status - e.g., 0: Closed, 1: Open)
    type: Number 
  },
  lockDoorStatus: { // 门锁定状态 (Door Lock Status - e.g., 0: Unlocked, 1: Locked)
    type: Number 
  },
  alarmStatus: { // 报警状态 (Alarm Status - e.g., "no_alarm", "sensor_alarm", "tamper_alarm")
    type: String 
  },
  // 其他动态状态字段可以在此添加
  // (Other dynamic status fields can be added here)

  // createdAt 和 updatedAt 会由 timestamps: true 自动管理
  // (createdAt and updatedAt will be automatically managed by timestamps: true)
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段 (Automatically add createdAt and updatedAt fields)
});

// 导出 DeviceStatus 模型
// (Export DeviceStatus model)
module.exports = mongoose.model('DeviceStatus', deviceStatusSchema);
