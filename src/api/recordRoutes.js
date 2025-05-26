// 导入 Express 框架
// Import the Express framework
const express = require('express');
// 创建路由实例
// Create a router instance
const router = express.Router();
// 导入 multer 用于处理 multipart/form-data
// Import multer for handling multipart/form-data
const multer = require('multer');
const IdentifyRecord = require('../models/identifyRecord'); // 引入IdentifyRecord模型 (Import IdentifyRecord model)
const SystemRecord = require('../models/systemRecord'); // 引入SystemRecord模型 (Import SystemRecord model)

// 配置 multer 实例
// Configure multer instance
const uploadRecord = multer().fields([
    { name: 'SN', maxCount: 1 },
    { name: 'RecordDetail', maxCount: 1 }, // 根据接口文档的参数表，这里是 RecordDetail (According to the API document's parameter table, this is RecordDetail)
    { name: 'Photo', maxCount: 1 }         // 可选的照片文件 (Optional photo file)
]);

// 处理设备上传打卡记录的请求
// @route POST /Record/UploadIdentifyRecord
// @desc 设备上传识别记录 (如刷卡、人脸识别等)
// (Device uploads identification records (e.g., card swipe, face recognition))
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UploadIdentifyRecord', uploadRecord, async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN, RecordDetail } = req.body;
    // const photoFile = (req.files && req.files.Photo) ? req.files.Photo[0] : null; // 照片处理暂缓 (Photo processing deferred)

    if (!SN || !RecordDetail) {
        // 如果SN或记录详情为空，则返回错误 (If SN or record detail is empty, return an error)
        return res.status(400).json({ Success: 0, Message: '设备SN和记录详情不能为空 (DeviceSN and RecordDetail cannot be empty)' });
    }

    let recordDetailJson;
    try {
        recordDetailJson = JSON.parse(RecordDetail);
    } catch (e) {
        console.error(`设备 SN: ${SN}, 解析打卡记录详情JSON失败 (Failed to parse identification record detail JSON):`, e);
        return res.status(400).json({ Success: 0, Message: '记录详情 (RecordDetail) JSON 格式错误 (RecordDetail JSON format error)' });
    }

    // 从解析后的JSON中提取必要字段和可选字段
    // (Extract necessary and optional fields from parsed JSON)
    const { 
        RecordID, RecordType, RecordDate, 
        UserID, Name, CardNum, QRCode, IsEntry, BodyTemp, PhotoLen, IdentityCard, Job, Department 
    } = recordDetailJson;

    // 校验 RecordID, RecordType, RecordDate 是否存在 (RecordID可以为0)
    // (Validate if RecordID, RecordType, RecordDate exist (RecordID can be 0))
    if (RecordID == null || RecordType == null || RecordDate == null) { 
        return res.status(400).json({ Success: 0, Message: '记录详情中缺少 RecordID, RecordType, 或 RecordDate (Missing RecordID, RecordType, or RecordDate in record detail)' });
    }
    
    console.log(`设备 SN: ${SN} 上传打卡记录: RecordID=${RecordID}, RecordType=${RecordType}`);

    try {
        // 创建新的识别记录文档
        // (Create new identification record document)
        const newIdentifyRecord = new IdentifyRecord({
            deviceSN: SN,
            recordID: RecordID,
            recordType: RecordType,
            recordDate: new Date(RecordDate * 1000), // 将秒级Unix时间戳转换为Date对象 (Convert Unix timestamp (seconds) to Date object)
            userID: UserID, // 可选 (Optional)
            name: Name,     // 可选 (Optional)
            identityCard: IdentityCard, // 可选 (Optional)
            job: Job,       // 可选 (Optional)
            department: Department, // 可选 (Optional)
            cardNum: CardNum,   // 可选 (Optional)
            qrCode: QRCode,     // 可选 (Optional)
            isEntry: IsEntry,   // 可选，布尔值或数字，根据Schema定义 (Optional, boolean or number, based on Schema definition)
            bodyTemp: BodyTemp, // 可选，数字 (Optional, number)
            photo: recordDetailJson.Photo, // 可选，假设 Photo 字段是照片的URL或引用标识 (Optional, assuming Photo field is URL or reference ID of photo)
            photoLen: PhotoLen  // 可选，数字 (Optional, number)
        });

        // 保存到数据库
        // (Save to database)
        await newIdentifyRecord.save();
        console.log(`设备 SN: ${SN}, RecordID: ${RecordID} 的打卡记录已成功保存。 (Identification record from device SN: ${SN}, RecordID: ${RecordID} successfully saved.)`);

        // 返回成功响应
        // (Return success response)
        res.json({ "Success": 1 });

    } catch (error) {
        console.error(`设备 SN: ${SN}, 保存打卡记录 RecordID: ${RecordID} 时发生错误 (Error saving identification record RecordID: ${RecordID} for device SN: ${SN}):`, error);
        // TODO: 更细致的错误处理，例如唯一键冲突 (deviceSN + RecordID 应唯一)。
        // (TODO: More detailed error handling, e.g., unique key conflict (deviceSN + RecordID should be unique).)
        // if (error.code === 11000) { // MongoDB duplicate key error code
        //     // 检查错误消息或字段以确定是哪个唯一键冲突
        //     // (Check error message or fields to determine which unique key conflicted)
        //     console.log(`设备 SN: ${SN}, RecordID: ${RecordID} 已存在，可能重复上传。 (RecordID ${RecordID} for device SN: ${SN} already exists, possible duplicate upload.)`);
        //     return res.status(409).json({ Success: 0, Message: '记录已存在或唯一性冲突 (Record already exists or uniqueness conflict)' });
        // }
        res.status(500).json({ Success: 0, Message: '服务器内部错误保存打卡记录 (Server internal error saving identification record)' });
    }
});

// 处理设备上传系统记录的请求
// @route POST /Record/UploadSystemRecord
// @desc 设备批量上传系统记录 (如门磁事件、报警事件等)
// (Device uploads system records in batch (e.g., door magnetic events, alarm events))
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UploadSystemRecord', async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN, RecordType, Records } = req.body; // RecordType 是主类型 (1-门磁, 2-系统), Records 是数组
                                                // (RecordType is the main type (1-door magnetic, 2-system), Records is an array)

    if (!SN) {
        // 如果SN为空，则返回错误 (If SN is empty, return an error)
        return res.status(400).json({ Success: 0, Message: '设备SN不能为空 (DeviceSN cannot be empty)' });
    }
    if (!Records || !Array.isArray(Records) || Records.length === 0) {
        // 如果Records为空或非数组，则返回错误 (If Records is empty or not an array, return an error)
        return res.status(400).json({ Success: 0, Message: '系统记录 (Records) 数组不能为空 (System records (Records) array cannot be empty)' });
    }
    // 校验主 RecordType 是否有效 (根据 SystemRecord schema 的 enum)
    // (Validate if main RecordType is valid (according to SystemRecord schema's enum))
    if (RecordType == null || ![1, 2].includes(parseInt(RecordType, 10))) { 
         return res.status(400).json({ Success: 0, Message: '主记录类型 (RecordType) 无效或缺失，必须为1或2 (Main record type (RecordType) invalid or missing, must be 1 or 2)' });
    }

    console.log(`设备 SN: ${SN} 上传系统记录，主类型: ${RecordType}，数量: ${Records.length}`);
    // (Device SN: ${SN} uploading system records, main type: ${RecordType}, count: ${Records.length})

    try {
        // 准备批量插入的文档数组
        // (Prepare document array for batch insert)
        const documentsToInsert = Records.map(recordItem => {
            // 验证每个记录项中的必要字段 (RecordID, RecordType (内部的), RecordDate)
            // (Validate necessary fields in each record item (RecordID, RecordType (internal), RecordDate))
            if (recordItem.RecordID == null || recordItem.RecordType == null || recordItem.RecordDate == null) {
                // 如果单个记录无效，记录警告并跳过该条 (If a single record is invalid, log a warning and skip it)
                console.warn(`设备 SN: ${SN}, 系统记录项缺少 RecordID, RecordType(内部事件类型) 或 RecordDate，已跳过:`, recordItem);
                // (Device SN: ${SN}, system record item missing RecordID, RecordType (internal event type) or RecordDate, skipped:)
                return null; // 返回 null，之后会通过 filter 过滤掉 (Return null, will be filtered out later by filter)
            }
            return {
                deviceSN: SN,
                recordID: recordItem.RecordID, // 设备上该条记录的ID (ID of this record on the device)
                outerRecordType: RecordType,    // 请求体顶层的 RecordType (1-门磁, 2-系统) (Top-level RecordType from request body (1-door magnetic, 2-system))
                eventSpecificType: recordItem.RecordType, // Records 数组中每条记录的 RecordType 是具体事件类型 (RecordType from each record in Records array is the specific event type)
                recordDate: new Date(recordItem.RecordDate * 1000) // Unix时间戳转Date (Convert Unix timestamp to Date)
            };
        }).filter(doc => doc !== null); // 过滤掉所有无效的记录项 (Filter out all invalid record items)

        if (documentsToInsert.length === 0 && Records.length > 0) {
            // 如果所有记录都无效 (但原始列表不为空) (If all records are invalid (but original list was not empty))
            console.log(`设备 SN: ${SN}, 所有提供的 ${Records.length} 条系统记录均无效，未插入任何记录。 (All ${Records.length} provided system records were invalid, no records inserted.)`);
            return res.status(400).json({ Success: 0, Message: '所有提供的系统记录项均无效 (All provided system record items are invalid)' });
        }
        
        if (documentsToInsert.length > 0) {
            // 执行批量插入
            // (Perform batch insert)
            await SystemRecord.insertMany(documentsToInsert, { ordered: false }); // ordered: false 允许部分成功 (ordered: false allows partial success)
            console.log(`设备 SN: ${SN}, 成功批量插入 ${documentsToInsert.length} 条系统记录。 (Device SN: ${SN}, successfully batch inserted ${documentsToInsert.length} system records.)`);
        } else {
            // 如果过滤后没有可插入的记录 (例如，原始 Records 数组为空，或所有项都无效)
            // (If no records to insert after filtering (e.g., original Records array was empty, or all items were invalid))
            console.log(`设备 SN: ${SN}, 未插入任何系统记录 (原始列表为空或所有记录项都无效)。 (No system records inserted (original list empty or all items invalid).)`);
        }

        // 返回成功响应
        // (Return success response)
        res.json({ "Success": 1 });

    } catch (error) {
        console.error(`设备 SN: ${SN}, 批量保存系统记录时发生错误 (Error batch saving system records for device SN: ${SN}):`, error);
        // TODO: 更细致的错误处理，例如 insertMany 中的部分写入失败 (如果 ordered:true)。
        // (TODO: More detailed error handling, e.g., partial write failures in insertMany (if ordered:true).)
        // 对于 ordered:false，错误对象可能包含写入错误的详情。
        // (For ordered:false, the error object might contain details of write errors.)
        // if (error.name === 'MongoBulkWriteError' && error.writeErrors && error.writeErrors.length > 0) {
        //   // 处理部分写入失败的情况 (Handle partial write failures)
        // }
        res.status(500).json({ Success: 0, Message: '服务器内部错误保存系统记录 (Server internal error saving system records)' });
    }
});

// 导出路由模块
// Export the router module
module.exports = router;
