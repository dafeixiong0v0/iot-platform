// 导入 Express 框架
// Import the Express framework
const express = require('express');
// 创建路由实例
// Create a router instance
const router = express.Router();

// 导入 multer 用于处理 multipart/form-data
// Import multer for handling multipart/form-data
const multer = require('multer');

// 为 /People/PushPeople 配置 multer 实例
// Configure multer instance for /People/PushPeople
const peopleUpload = multer().fields([
    { name: 'SN', maxCount: 1 },
    { name: 'PushType', maxCount: 1 },
    { name: 'UserID', maxCount: 1 },
    { name: 'Detail', maxCount: 1 },   // 人员详情JSON字符串 (Personnel details JSON string)
    { name: 'Photo', maxCount: 1 }    // 人员照片文件 (Personnel photo file)
]);

// 处理设备拉取人员授权信息的请求
// @route POST /People/DownloadPeopleList
// @desc 设备请求下载授权人员列表 (Device requests to download the list of authorized personnel)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DownloadPeopleList', (req, res) => {
    // 从请求体中获取设备SN和请求数量限制
    // Get device SN and request quantity limit from the request body
    const { SN, Limit } = req.body;

    // 打印接收到的设备SN和Limit (用于当前阶段的调试)
    // Print received device SN and Limit (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 请求下载人员列表，数量限制: ${Limit}。 (Device SN: ${SN} requests download of personnel list, limit: ${Limit}.)`);

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 根据设备SN和Limit参数，以及可能的其他筛选条件（如上次同步时间戳），从 People 集合查询相应的人员数据 (Query corresponding personnel data from the People collection based on device SN, Limit parameter, and possibly other filtering criteria like last sync timestamp)
    // 3. 构建 PeopleList 数组，其中每个元素都符合 "PeopleJson人员数据格式" (Construct the PeopleList array, where each element conforms to "PeopleJson personnel data format")
    // 4. 处理照片、人脸特征、指纹等二进制数据（例如，提供URL或Base64编码） (Handle binary data like photos, facial features, fingerprints (e.g., provide URL or Base64 encoding))
    // 5. 实现分页逻辑，以支持大量人员数据的分批下载 (Implement pagination logic to support batch download of large amounts of personnel data)

    // 当前返回空的人员列表作为占位符响应
    // Currently return an empty personnel list as a placeholder response
    res.json({
        "Success": 1, // 1 表示操作成功 (1 means operation successful)
        "Message": "当前无人员信息可供下载", // 可选的提示信息 (Optional informational message)
        "PeopleCount": 0, // 当前返回的人员数量 (Number of personnel currently returned)
        "PeopleList": [] // 人员数据列表，当前为空 (List of personnel data, currently empty)
    });
});

// 处理设备主动推送人员信息的请求
// @route POST /People/PushPeople
// @desc 设备在本地新增、修改或删除人员时，或响应服务器查询指令时，主动推送人员信息到平台
// (Device actively pushes personnel information to the platform when adding, modifying, or deleting personnel locally, or in response to a server query command)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/PushPeople', peopleUpload, (req, res) => {
    // 从请求体和文件获取数据
    // Get data from request body and files
    const { SN, PushType, UserID, Detail } = req.body;
    const photoFile = (req.files && req.files.Photo) ? req.files.Photo[0] : null;

    // 打印接收到的基本信息 (用于当前阶段的调试)
    // Print received basic information (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 主动推送人员信息。 (Device SN: ${SN} is actively pushing personnel information.)`);
    // 根据 PushType 值给出中文说明
    // Provide Chinese explanation based on PushType value
    let pushTypeDescription = '';
    switch (String(PushType)) { // 将PushType转为字符串以确保匹配 (Convert PushType to string to ensure match)
        case '1': pushTypeDescription = '新增 (Add)'; break;
        case '2': pushTypeDescription = '更新 (Update)'; break;
        case '3': pushTypeDescription = '删除 (Delete)'; break;
        case '4': pushTypeDescription = '查询响应 (Query Response)'; break;
        default: pushTypeDescription = '未知类型 (Unknown Type)';
    }
    console.log(`操作类型 (PushType): ${PushType} (${pushTypeDescription}), 人员ID (UserID): ${UserID}`);

    let personDetail = {};
    if (Detail) {
        try {
            // 注意：文档中提到 Detail 内容可能经过gzip压缩。此处暂时假定为普通JSON字符串。
            // Gzip 解压逻辑可以在后续步骤中添加。
            // Note: The document mentions that Detail content might be gzip compressed. Here, we temporarily assume it's a plain JSON string.
            // Gzip decompression logic can be added in subsequent steps.
            personDetail = JSON.parse(Detail);
            // 打印部分人员详情，例如姓名和卡号 (如果存在)
            // Print partial personnel details, e.g., Name and CardNum (if they exist)
            console.log(`人员详情 (部分解析): 名称 - ${personDetail.Name || 'N/A'}, 卡号 - ${personDetail.CardNum || 'N/A'}`);
        } catch (error) {
            console.error("解析人员详情 (Detail) JSON 字符串失败 (Failed to parse personnel detail (Detail) JSON string):", error);
            // 在实际应用中，可能需要返回错误响应
            // In a real application, an error response might be needed
            // return res.status(400).json({ Success: 0, Message: "人员详情格式错误 (Personnel detail format error)" });
        }
    } else if (String(PushType) !== '3') { // 删除操作(3)可能没有Detail字段 (Delete operation (3) might not have Detail field)
        console.log("请求中未找到人员详情 (Detail) 字段。 (Personnel detail (Detail) field not found in request.)");
    }


    if (photoFile) {
        console.log(`上传了人员照片 (Uploaded personnel photo): ${photoFile.originalname}, 大小 (Size): ${photoFile.size} bytes`);
        // TODO: 在后续步骤中，这里将包含照片文件的处理逻辑，例如保存到 GridFS 或文件系统
        // In subsequent steps, this will include logic for handling the photo file, e.g., saving to GridFS or filesystem.
    }

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 根据 PushType 执行相应操作 (Perform corresponding actions based on PushType):
    //    - 新增(1)/更新(2): 解析 Detail，创建或更新 People 集合中的人员文档。处理照片。 (Add(1)/Update(2): Parse Detail, create or update personnel document in People collection. Handle photo.)
    //    - 删除(3): 根据 UserID (和 SN) 从 People 集合中删除或标记人员。 (Delete(3): Delete or mark personnel from People collection based on UserID (and SN).)
    //    - 查询(4): 通常是服务器发起的，设备响应。此处可能是设备推送查询到的人员信息。 (Query(4): Usually initiated by the server, device responds. This could be the device pushing queried personnel information.)
    // 3. 记录此操作。 (Log this operation.)

    // 返回标准成功响应
    // Return standard success response
    res.json({
        "Success": 1
    });
});

// 处理设备反馈删除人员操作结果的请求
// @route POST /People/DeletePeopleListResult
// @desc 设备上报其删除一批人员后的结果 (Device reports the results after deleting a batch of personnel)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DeletePeopleListResult', (req, res) => {
    // 从请求体中获取数据
    // Get data from the request body
    const { SN, DeleteCount, DeleteAll, DeleteList } = req.body;

    // 打印接收到的设备SN和操作结果 (用于当前阶段的调试)
    // Print received device SN and operation results (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 反馈删除人员操作结果。 (Device SN: ${SN} reports result of personnel deletion.)`);
    console.log(`删除数量 (Deleted count): ${DeleteCount}, 是否全部删除 (All deleted): ${DeleteAll === 1 ? '是 (Yes)' : '否 (No)'}`);

    // 检查 DeleteList 是否存在且包含元素
    // Check if DeleteList exists and contains elements
    if (DeleteList && DeleteList.length > 0) {
        console.log(`已删除的用户ID列表 (${DeleteList.length} 条): ${DeleteList.join(', ')} (List of deleted User IDs (${DeleteList.length} items): ${DeleteList.join(', ')})`);
    } else if (DeleteAll === 1) {
        // 如果 DeleteAll 为 1，表示设备已清空所有人员
        // If DeleteAll is 1, it means the device has cleared all personnel
        console.log("设备已清空所有人员信息。 (Device has cleared all personnel information.)");
    } else {
        // 如果 DeleteList 为空且 DeleteAll 不为 1，说明没有具体人员列表被删除
        // If DeleteList is empty and DeleteAll is not 1, it means no specific personnel list was deleted
        console.log("未提供已删除的具体人员列表或列表为空。 (No specific list of deleted personnel provided, or the list is empty.)");
    }

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 根据上报结果更新数据库状态 (例如，从 People 集合中移除这些人员与该设备的关联，或标记为已从该设备删除)
    //    (Update database status based on reported results (e.g., remove association of these personnel with this device from People collection, or mark as deleted from this device))
    // 3. 记录此删除事件，可能写入日志或特定事件表 (Log this deletion event, possibly to logs or a specific event table)

    // 返回标准成功响应
    // Return standard success response
    res.json({
        "Success": 1 // 1 表示操作成功 (1 means operation successful)
    });
});

// 处理设备拉取待删除人员列表的请求
// @route POST /People/DeletePeopleList
// @desc 设备请求下载需要从其本地存储中删除的人员列表 (Device requests to download the list of personnel to be deleted from its local storage)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DeletePeopleList', (req, res) => {
    // 从请求体中获取设备SN和可选的Limit参数
    // Get device SN and optional Limit parameter from the request body
    const { SN, Limit } = req.body;
    // 如果Limit未提供或无效，默认为50。根据文档，最大值为1000。
    // If Limit is not provided or invalid, default to 50. Max value is 1000 according to documentation.
    const effectiveLimit = (Limit && Limit > 0 && Limit <= 1000) ? Limit : 50;

    // 打印接收到的设备SN和Limit (用于当前阶段的调试)
    // Print received device SN and Limit (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 请求待删除人员列表，数量限制: ${effectiveLimit}。 (Device SN: ${SN} requests list of personnel to delete, limit: ${effectiveLimit}.)`);

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 查询 RemoteCommandQueue 集合中是否有针对此SN的 "DeletePeople" 类型的指令，或者查询 People 集合中标记为待删除且与此设备关联的人员 (Query RemoteCommandQueue for "DeletePeople" commands for this SN, or query People collection for personnel marked as pending deletion and associated with this device)
    // 3. 根据 effectiveLimit 限制返回数量 (Limit the returned quantity according to effectiveLimit)
    // 4. 如果有全局删除指令 (DeleteAll=1)，则相应设置 (If there's a global delete command (DeleteAll=1), set accordingly)
    // 5. 构建 DeleteList 数组，其中包含需要删除的用户ID (Construct the DeleteList array containing UserIDs to be deleted)

    // 当前默认返回空列表，不删除任何人员
    // Currently returns an empty list by default, not deleting any personnel
    res.json({
        "Success": 1, // 1 表示操作成功 (1 means operation successful)
        "DeleteAll": 0, // 0：按指定用户号删除, 1：清空所有人员信息 (当前默认为0) (0: Delete by specified user ID, 1: Clear all personnel information (currently defaults to 0))
        "DeleteCount": 0, // 符合条件的待删除人员数量 (当前为0) (Number of personnel to be deleted matching criteria (currently 0))
        "DeleteList": []  // 需要删除的用户号数组 (当前为空) (Array of user IDs to be deleted (currently empty))
    });
});

// 处理设备反馈拉取人员存储结果的请求
// @route POST /People/DownloadPeopleListResult
// @desc 设备上报其导入一批人员后的结果（成功、失败及原因） (Device reports the results after importing a batch of personnel (success, failure, and reasons))
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DownloadPeopleListResult', (req, res) => {
    // 从请求体中获取数据
    // Get data from the request body
    const { SN, SuccessCount, FailCount, FailList } = req.body;

    // 打印接收到的设备SN和统计信息 (用于当前阶段的调试)
    // Print received device SN and statistics (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 反馈拉取人员存储结果。 (Device SN: ${SN} reports result of storing downloaded personnel.)`);
    console.log(`导入成功数量 (Import success count): ${SuccessCount}, 导入失败数量 (Import fail count): ${FailCount}`);

    // 如果有失败列表，并且列表不为空，则打印失败详情
    // If FailList exists and is not empty, print failure details
    if (FailList && FailList.length > 0) {
        console.log(`失败详情 (${FailList.length} 条): (Failure details (${FailList.length} items):)`);
        FailList.forEach((failItem, index) => {
            // 打印每条失败记录的详细信息
            // Print details of each failed record
            console.log(`  ${index + 1}. 用户ID (User ID): ${failItem.UserID}, 错误码 (Error Code): ${failItem.ErrorCode}, 重复ID (Repeat ID): ${failItem.RepeatID || 'N/A'}, 错误信息 (Error Message): '${failItem.ErrMsg}'`);
        });
    }

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 记录或更新这些导入结果，可能用于追踪同步状态或调试问题 (Record or update these import results, possibly for tracking synchronization status or debugging issues)
    // 3. 对于失败的条目，可能需要标记或进行后续处理 (For failed entries, marking or subsequent processing may be required)

    // 返回标准成功响应
    // Return standard success response
    res.json({
        "Success": 1 // 1 表示操作成功 (1 means operation successful)
    });
});

// 导出路由模块
// Export the router module
module.exports = router;
