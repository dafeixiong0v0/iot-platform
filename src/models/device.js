// src/models/device.js
const mongoose = require('mongoose');

/**
 * @typedef {object} Device JSDoc for reference, Mongoose schema is the source of truth
 * @property {string} deviceSN - 设备的序列号，唯一且索引
 * @property {string} deviceName - 设备名称
 * @property {string} firmwareVersion - 固件版本
 * @property {string} [ipAddress] - IP地址 (设备上报或配置的)
 * @property {string} macAddress - MAC地址
 * @property {string} httpClientServerAddr - HTTP客户端连接的服务器地址
 * @property {number} httpClientKeepaliveTime - HTTP客户端心跳间隔 (秒)
 * @property {string} mqttServerAddr - MQTT连接的服务器地址
 * @property {object} functionList - 设备支持的功能列表 (例如: { BodyTemperature: true, Fingerprint: false, ... })
 * @property {object} workSettings - 完整的设备工作参数 (使用 Mixed 类型存储整个JSON结构)
 * @property {string} manufacturer - 制造商
 * @property {string} productionDate - 生产日期
 * @property {Date} createdAt - 创建时间 (由Mongoose自动管理)
 * @property {Date} updatedAt - 更新时间 (由Mongoose自动管理)
 */

// 设备信息 Schema
// (Device Information Schema)
const deviceSchema = new mongoose.Schema({
  deviceSN: { // 设备序列号 (Device Serial Number)
    type: String,
    required: true, // 必须字段 (Required field)
    unique: true,   // 唯一索引 (Unique index)
    index: true     // 建立索引以提高查询效率 (Create index to improve query efficiency)
  },
  deviceName: { // 设备名称 (Device Name)
    type: String 
  },
  firmwareVersion: { // 固件版本 (Firmware Version)
    type: String 
  },
  ipAddress: { // IP地址 (设备上报或配置的) (IP Address - reported by device or configured)
    type: String 
  },
  macAddress: { // MAC地址 (MAC Address)
    type: String 
  },
  
  // HTTP Client 相关配置 (HTTP Client related configurations)
  httpClientServerAddr: { // HTTP Client 服务器地址 (HTTP Client Server Address)
    type: String 
  },
  httpClientKeepaliveTime: { // HTTP Client 心跳间隔 (秒) (HTTP Client Keepalive Interval - seconds)
    type: Number, 
    default: 30 
  },
  
  // MQTT Client 相关配置 (MQTT Client related configurations)
  mqttServerAddr: { // MQTT 服务器地址 (MQTT Server Address)
    type: String 
  },

  // 设备功能列表 (参考《设备工作参数.md》中的 FunctionList 结构)
  // 例如: { "BodyTemperature": true, "Fingerprint": false, ... }
  // (Device Function List - refer to FunctionList structure in "设备工作参数.md")
  // (e.g., { "BodyTemperature": true, "Fingerprint": false, ... })
  functionList: { 
    type: Object 
  }, 

  // 存储完整的设备工作参数 (参考《设备工作参数.md》)
  // 使用 Mixed 类型可以存储任意结构的JSON对象，但会失去Mongoose的一些校验和类型转换能力。
  // 另一种方式是为工作参数定义一个详细的嵌套Schema，但如果参数结构多变或非常复杂，Mixed类型更灵活。
  // (Stores the complete device working parameters - refer to "设备工作参数.md")
  // (Using Mixed type allows storage of any JSON object structure, but loses some Mongoose validation and type conversion capabilities.)
  // (Alternatively, a detailed nested Schema could be defined for work parameters, but Mixed type is more flexible if the parameter structure is variable or very complex.)
  workSettings: { 
    type: mongoose.Schema.Types.Mixed 
  },

  manufacturer: { // 制造商 (Manufacturer)
    type: String 
  },
  productionDate: { // 生产日期 (Production Date)
    type: String 
  },
  // createdAt 和 updatedAt 会由 timestamps: true 自动管理
  // (createdAt and updatedAt will be automatically managed by timestamps: true)
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段 (Automatically add createdAt and updatedAt fields)
});

// 导出 Device 模型
// (Export Device model)
module.exports = mongoose.model('Device', deviceSchema);
