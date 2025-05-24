/**
 * @typedef {object} IdentifyRecord
 * @property {string} deviceSN - 设备序列号，需要索引
 * @property {number} recordID - 设备生成的记录ID
 * @property {number} recordType - 记录类型 (参考 "RecordType 事件类型" 定义，例如: 0:刷卡, 1:指纹, 2:人脸, 3:密码, 4:二维码, 5:多重验证, 6:手动输入, 7:远程开门, 8:按钮开门, 9:出门开关, 10:胁迫报警, 11:陌生人, 12:黑名单, 13:卡号不存在, 14:有效期错误, 15:时段错误, 16:节假日错误, 17:次数用尽, 18:体温异常, 19:未戴口罩)
 * @property {Date} recordDate - 记录时间，需要索引
 * @property {string} [userID] - 用户ID (如果能识别到)
 * @property {string} [name] - 姓名 (如果能识别到)
 * @property {string} [identityCard] - 身份证号 (如果能识别到)
 * @property {string} [job] - 职务 (如果能识别到)
 * @property {string} [department] - 部门 (如果能识别到)
 * @property {string} [cardNum] - 卡号 (如果通过刷卡识别)
 * @property {string} [qrCode] - 二维码数据 (如果通过二维码识别)
 * @property {boolean} [isEntry] - 是否为进入事件 (例如: true表示进入，false表示外出，具体含义根据设备和场景确定)
 * @property {number} [bodyTemp] - 体温 (单位：摄氏度，例如 36.5)
 * @property {string} [photo] - 抓拍照片存放路径 (URL或GridFS引用)
 * @property {number} [photoLen] - 照片数据长度
 * @property {Date} createdAt - 记录创建时间 (在服务器端生成)
 */

// Note: This file only contains JSDoc comments for schema definition.
// Actual Mongoose schema will be implemented later.
// The recordType values are examples and should be mapped according to the "RecordType 事件类型" table in the API document.
