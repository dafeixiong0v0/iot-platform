/**
 * @typedef {object} Device
 * @property {string} deviceSN - 设备的序列号，唯一且索引
 * @property {string} deviceName - 设备名称
 * @property {string} firmwareVersion - 固件版本
 * @property {string} [ipAddress] - IP地址 (如果是静态分配)
 * @property {string} macAddress - MAC地址
 * @property {string} httpClientServerAddr - HTTP客户端连接的服务器地址
 * @property {string} mqttServerAddr - MQTT连接的服务器地址
 * @property {object} functionList - 设备支持的功能列表
 * @property {string} Manufacturer - 制造商
 * @property {string} ProductionDate - 生产日期
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

// Note: This file only contains JSDoc comments for schema definition.
// Actual Mongoose schema will be implemented later.
