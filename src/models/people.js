/**
 * @typedef {object} People
 * @property {string} userID - 用户ID，建议与deviceSN组合确保全局唯一性，或使用独立的全局人员ID
 * @property {string} code - 人员编号/工号
 * @property {string} name - 姓名
 * @property {string} [job] - 职务
 * @property {string} [department] - 部门
 * @property {string} [identityCard] - 身份证号
 * @property {string} [attachment] - 附件信息 (例如：额外备注)
 * @property {string} [photo] - 照片存放路径 (URL或GridFS引用)
 * @property {string} [photoMD5] - 照片的MD5值
 * @property {string} [password] - 密码 (用于设备本地验证)
 * @property {string} [cardNum] - 卡号 (应建立索引)
 * @property {string} [qrCode] - 二维码数据
 * @property {number} [accessType=0] - 权限类型 (0: 普通, 1: 管理员, 2: 黑名单)
 * @property {Date} [expirationDate] - 有效期截止日期
 * @property {number} [openTimes=0] - 可开门次数 (0表示不限制)
 * @property {boolean} [keepOpen=false] - 是否保持常开权限
 * @property {number} [timegroupID] - 时间组ID (关联到时间组定义，用于控制通行时段)
 * @property {(string|string[])} [holidays] - 节假日限制 (具体格式待定，如 "all", "none", 或日期数组)
 * @property {(string|string[])} [elevators] - 电梯权限 (可通行的电梯编号或范围)
 * @property {string} [faceFeature] - 人脸特征数据存放路径 (URL或GridFS引用)
 * @property {string} [faceFeatureMD5] - 人脸特征数据的MD5值
 * @property {Array<object>} [fingerprints] - 指纹信息列表
 * @property {number} fingerprints[].Num - 指纹编号 (1-10)
 * @property {string} fingerprints[].Data - 指纹数据 (Base64编码)
 * @property {string} fingerprints[].MD5 - 指纹数据的MD5值
 * @property {Array<object>} [palmveins] - 掌静脉信息列表
 * @property {number} palmveins[].Num - 掌静脉编号 (1-3)
 * @property {string} palmveins[].Data - 掌静脉数据 (Base64编码)
 * @property {string} palmveins[].MD5 - 掌静脉数据的MD5值
 * @property {string[]} [associatedDeviceSNs] - 关联的设备序列号列表 (如果人员信息下发到多个设备)
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

// Note: This file only contains JSDoc comments for schema definition.
// Actual Mongoose schema will be implemented later.
