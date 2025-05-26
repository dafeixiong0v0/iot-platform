// src/models/people.js
const mongoose = require('mongoose');

/**
 * JSDoc for reference, Mongoose schema is the source of truth
 * @typedef {object} People
 * @property {string} userID - 用户在设备上的ID (注意: 全局唯一性可能需要 deviceSN + userID 组合或单独的全局ID)
 * @property {string[]} deviceSNs - 此人关联的设备SN列表
 * @property {string} code - 人员编号
 * @property {string} name - 人员姓名
 * @property {string} [job] - 职务
 * @property {string} [department] - 部门
 * @property {string} [identityCard] - 身份证号码
 * @property {string} [attachment] - 其他人员信息
 * @property {string} [photo] - 照片信息 (URL 或 GridFS 文件ID)
 * @property {string} [photoMD5] - 照片MD5
 * @property {string} [password] - 密码 (注意加密存储)
 * @property {string} [cardNum] - 卡号
 * @property {string} [qrCode] - 人员二维码信息
 * @property {number} [accessType=0] - 角色 0:普通人员; 1:管理员; 2:黑名单
 * @property {Date} [expirationDate] - 权限截止日期 (0 或 null 表示无期限)
 * @property {number} [openTimes=65535] - 开门次数; 65535:无限制, 0:禁止
 * @property {boolean} [keepOpen=false] - 是否为常开卡
 * @property {number} [timegroupID] - 开门时段组 ID
 * @property {string} [holidays] - 节假日限制 (逗号分隔的节假日编号)
 * @property {string} [elevators] - 电梯端口权限 (逗号分隔的端口号)
 * @property {string} [faceFeature] - 人脸特征码 (URL 或 GridFS 文件ID)
 * @property {string} [faceFeatureMD5] - 人脸特征码MD5
 * @property {Array<object>} [fingerprints] - 指纹对象数组
 * @property {number} fingerprints[].num - 指纹索引号
 * @property {string} fingerprints[].data - 指纹特征码
 * @property {string} fingerprints[].md5 - 特征码MD5
 * @property {Array<object>} [palmveins] - 掌纹对象数组
 * @property {number} palmveins[].num - 掌纹索引号
 * @property {string} palmveins[].data - 掌纹特征码
 * @property {string} palmveins[].md5 - 特征码MD5
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

// 人员信息 Schema
// (People Information Schema)
const peopleSchema = new mongoose.Schema({
  userID: { // 用户在设备上的ID (User ID on the device)
    type: String,
    required: true, // 必须字段 (Required field)
    index: true     // 建立索引 (Create index)
    // 注意: 全局唯一性可能需要 deviceSN + userID 组合或单独的全局ID，这取决于应用设计。
    // (Note: Global uniqueness might require a combination of deviceSN + userID or a separate global ID, depending on application design.)
  },
  deviceSNs: [{ // 此人关联的设备SN列表 (List of device SNs this person is associated with)
    type: String,
    index: true // 对数组中的每个元素建立索引 (Index each element in the array)
  }],
  code: { // 人员编号 (Personnel Code)
    type: String 
  },
  name: { // 人员姓名 (Personnel Name)
    type: String,
    required: true // 必须字段 (Required field)
  },
  job: { // 职务 (Job Title)
    type: String 
  },
  department: { // 部门 (Department)
    type: String 
  },
  identityCard: { // 身份证号码 (Identity Card Number)
    type: String 
  },
  attachment: { // 其他人员信息 (Other personnel information)
    type: String 
  },
  photo: { // 照片信息 (URL 或 GridFS 文件ID) (Photo information - URL or GridFS file ID)
    type: String 
  },
  photoMD5: { // 照片MD5 (Photo MD5)
    type: String 
  },
  password: { // 密码 (注意加密存储) (Password - Note: store encrypted)
    type: String 
  },
  cardNum: { // 卡号 (Card Number)
    type: String,
    index: true // 建立索引 (Create index)
  },
  qrCode: { // 人员二维码信息 (Personnel QR Code information)
    type: String 
  },
  accessType: { // 角色 0:普通人员; 1:管理员; 2:黑名单 (Role - 0: Normal; 1: Admin; 2: Blacklist)
    type: Number,
    default: 0 
  },
  expirationDate: { // 权限截止日期 (0 或 null 表示无期限) (Permission expiration date - 0 or null means no limit)
    type: Date 
  },
  openTimes: { // 开门次数; 65535:无限制, 0:禁止 (Door open times; 65535: unlimited, 0: prohibited)
    type: Number,
    default: 65535 
  },
  keepOpen: { // 是否为常开卡 (Whether it is a keep-open card)
    type: Boolean,
    default: false 
  },
  timegroupID: { // 开门时段组 ID (关联到设备的Timegroup配置) (Door open time group ID - related to device's Timegroup configuration)
    type: Number 
  },
  holidays: { // 节假日限制 (逗号分隔的节假日编号) (Holiday restrictions - comma-separated holiday numbers)
    type: String 
  },
  elevators: { // 电梯端口权限 (逗号分隔的端口号) (Elevator port permissions - comma-separated port numbers)
    type: String 
  },
  faceFeature: { // 人脸特征码 (URL 或 GridFS 文件ID) (Facial feature code - URL or GridFS file ID)
    type: String 
  },
  faceFeatureMD5: { // 人脸特征码MD5 (Facial feature code MD5)
    type: String 
  },
  fingerprints: [{ // 指纹对象数组 (Array of fingerprint objects)
    num: Number, // 指纹索引号 (Fingerprint index number)
    data: String, // 指纹特征码 (URL 或 GridFS 文件ID 或 Base64) (Fingerprint feature code - URL, GridFS file ID, or Base64)
    md5: String  // 特征码MD5 (Feature code MD5)
  }],
  palmveins: [{ // 掌纹对象数组 (Array of palm vein objects)
    num: Number, // 掌纹索引号 (Palm vein index number)
    data: String, // 掌纹特征码 (Palm vein feature code)
    md5: String  // 特征码MD5 (Feature code MD5)
  }],
  // createdAt 和 updatedAt 会由 timestamps: true 自动管理
  // (createdAt and updatedAt will be automatically managed by timestamps: true)
}, {
  timestamps: true // 自动添加 createdAt 和 updatedAt 字段 (Automatically add createdAt and updatedAt fields)
});

// 导出 People 模型
// (Export People model)
module.exports = mongoose.model('People', peopleSchema);
