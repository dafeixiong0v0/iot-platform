// 导入 Express 框架
// Import the Express framework
const express = require('express');
// 创建路由实例
// Create a router instance
const router = express.Router();
// 导入 multer 用于处理 multipart/form-data
// Import multer for handling multipart/form-data
const multer = require('multer');

// 配置 multer 实例
// Configure multer instance
const uploadRecord = multer().fields([
    { name: 'SN', maxCount: 1 },
    { name: 'RecordDetail', maxCount: 1 }, // 根据接口文档的参数表，这里是 RecordDetail (According to the API document's parameter table, this is RecordDetail)
    { name: 'Photo', maxCount: 1 }         // 可选的照片文件 (Optional photo file)
]);

// 处理设备上传打卡记录的请求
// @route POST /Record/UploadIdentifyRecord
// @desc 设备上传识别记录 (如刷卡、人脸识别等) (Device uploads identification records (e.g., card swipe, face recognition))
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UploadIdentifyRecord', uploadRecord, (req, res) => {
    // 从请求体和文件获取数据
    // Get data from request body and files
    const { SN, RecordDetail } = req.body; // 'RecordDetail' from parameter table
    const photoFile = (req.files && req.files.Photo) ? req.files.Photo[0] : null;

    // 打印接收到的设备SN (用于当前阶段的调试)
    // Print received device SN (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 上传打卡记录。 (Device SN: ${SN} is uploading an identification record.)`);

    let recordDetailJson = {};
    if (RecordDetail) {
        try {
            // 文档示例中form-data部分的字段名是 recordJson, 但参数表是 RecordDetail。以参数表为准。
            // (In the document example, the field name in form-data is recordJson, but the parameter table says RecordDetail. We follow the parameter table.)
            // 文档还提到 recordJson (即RecordDetail) 内容可能经过gzip压缩。此处暂时假定为普通JSON字符串。
            // (The document also mentions that recordJson (i.e., RecordDetail) content might be gzip compressed. Here, we temporarily assume it's a plain JSON string.)
            recordDetailJson = JSON.parse(RecordDetail);
            // 打印部分记录详情。注意 RecordDate 是秒级时间戳。
            // Print partial record details. Note that RecordDate is a Unix timestamp in seconds.
            console.log(`打卡记录详情: RecordID=${recordDetailJson.RecordID}, RecordType=${recordDetailJson.RecordType}, UserID=${recordDetailJson.UserID || 'N/A'}, 时间 (Time)=${new Date(recordDetailJson.RecordDate * 1000).toLocaleString()}`);
        } catch (error) {
            console.error("解析打卡记录详情 (RecordDetail) JSON 字符串失败 (Failed to parse identification record detail (RecordDetail) JSON string):", error);
            // 在实际应用中，可能需要返回错误响应
            // In a real application, an error response might be needed
            // return res.status(400).json({ Success: 0, Message: "记录详情格式错误 (Record detail format error)" });
        }
    } else {
        console.log("请求中未找到打卡记录详情 (RecordDetail) 字段。 (Identification record detail (RecordDetail) field not found in request.)");
        // 根据需求，如果 RecordDetail 是必需的，可以返回错误
        // Depending on requirements, if RecordDetail is mandatory, an error can be returned
        // return res.status(400).json({ Success: 0, Message: "缺少记录详情 (Missing record detail)" });
    }

    if (photoFile) {
        console.log(`上传了打卡现场照片: ${photoFile.originalname}, 大小 (Size): ${photoFile.size} bytes`);
        // TODO: 在后续步骤中，这里将包含照片文件的处理逻辑，例如保存到 GridFS 或文件系统
        // In subsequent steps, this will include logic for handling the photo file, e.g., saving to GridFS or filesystem.
    }

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (以及是否允许上传数据, 例如返回 Success:401 表示设备未授权)
    //    (Validate the legitimacy of the device SN (and whether it's allowed to upload data, e.g., return Success:401 for unauthorized device))
    // 2. 将解析后的记录（包括照片信息）存储到 IdentifyRecord 集合
    //    (Store the parsed record (including photo information) into the IdentifyRecord collection)
    // 3. 如果有照片，保存照片文件并将存储路径或引用关联到记录
    //    (If there's a photo, save the photo file and associate the storage path or reference with the record)

    // 返回标准成功响应 (根据文档，成功时仅返回 Success:1)
    // Return standard success response (according to the documentation, only Success:1 is returned on success)
    res.json({
        "Success": 1
    });
});

// 处理设备上传系统记录的请求
// @route POST /Record/UploadSystemRecord
// @desc 设备批量上传系统记录 (如门磁事件、报警事件等) (Device uploads system records in batch (e.g., door magnetic events, alarm events))
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UploadSystemRecord', (req, res) => {
    // 从请求体中获取数据
    // Get data from the request body
    const { SN, RecordType, Records } = req.body;

    // 打印接收到的设备SN和主记录类型 (用于当前阶段的调试)
    // Print received device SN and main record type (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 上传系统记录，主类型 (Outer RecordType): ${RecordType}。 (Device SN: ${SN} is uploading system records, outer RecordType: ${RecordType}.)`);

    // 检查 Records 数组是否存在且包含元素
    // Check if Records array exists and contains elements
    if (Records && Records.length > 0) {
        console.log(`共收到 ${Records.length} 条系统记录。 (Received ${Records.length} system records in total.)`);
        // 打印第一条记录的详情作为示例
        // Print details of the first record as an example
        const firstRecord = Records[0];
        console.log(`第一条记录详情: RecordID=${firstRecord.RecordID}, 事件类型 (Inner RecordType)=${firstRecord.RecordType}, 时间 (Time)=${new Date(firstRecord.RecordDate * 1000).toLocaleString()}`);
        
        // 可选择性地遍历并记录所有日志，但要注意日志量
        // Optionally iterate and log all records, but be mindful of log volume
        // Records.forEach((record, index) => {
        //     console.log(`  记录 ${index + 1}: RecordID=${record.RecordID}, 事件类型=${record.RecordType}, 时间=${new Date(record.RecordDate * 1000).toLocaleString()}`);
        // });
    } else {
        console.log("上传的系统记录列表为空或未提供。 (The uploaded system record list is empty or not provided.)");
    }

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 遍历 Records 数组，将每条记录存储到 SystemRecord 集合 (Iterate through Records array, store each record into SystemRecord collection)
    // 3. 注意区分主 RecordType (门磁记录/系统记录大类) 和每条记录内部的 RecordType (具体事件类型)，确保数据正确分类存储
    //    (Pay attention to differentiate the outer RecordType (main category of door magnetic/system records) and the inner RecordType of each record (specific event type), ensuring data is stored with correct classification)

    // 返回标准成功响应
    // Return standard success response
    res.json({
        "Success": 1
    });
});

// 导出路由模块
// Export the router module
module.exports = router;
