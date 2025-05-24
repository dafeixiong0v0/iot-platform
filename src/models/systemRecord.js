/**
 * @typedef {object} SystemRecord
 * @property {string} deviceSN - 设备序列号，需要索引
 * @property {number} recordID - 设备生成的记录ID
 * @property {number} recordType - 记录类型 (1: 门磁记录, 2: 系统记录)
 * @property {number} eventSpecificType - 特定事件类型代码
 *    (当 recordType=1 时, 参考 "门磁记录 事件类型": 0:门磁关, 1:门磁开, 2:按钮开门, 3:胁迫开门, 4:远程开门, 5:出门开关开门, 6:常开状态, 7:常关状态, 8:门未关报警, 9:门被意外打开报警, 10:胁迫报警, 11:防拆报警, 12:火警报警, 13:烟感报警, 14:匪警报警, 15:紧急按钮报警, 16:其他报警)
 *    (当 recordType=2 时, 参考 "系统记录 事件类型": 0:设备上电, 1:设备重启, 2:设备参数修改, 3:设备时间修改, 4:恢复出厂设置, 5:固件升级, 6:数据清除, 7:NTP校时, 8:HTTP连接成功, 9:HTTP连接失败, 10:MQTT连接成功, 11:MQTT连接失败, 12:网络断开, 13:网络连接成功, 14:TF卡满, 15:TF卡异常, 16:RTC异常)
 * @property {Date} recordDate - 记录时间，需要索引
 * @property {Date} createdAt - 记录创建时间 (在服务器端生成)
 */

// Note: This file only contains JSDoc comments for schema definition.
// Actual Mongoose schema will be implemented later.
// The eventSpecificType values are examples and should be mapped according to the "门磁记录 事件类型" and "系统记录 事件类型" tables in the API document.
