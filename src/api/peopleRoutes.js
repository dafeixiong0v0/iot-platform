// 导入 Express 框架
// Import the Express framework
const express = require('express');
// 创建路由实例
// Create a router instance
const router = express.Router();
const People = require('../models/people'); // 引入People模型 (Import People model)

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
// @desc 设备请求下载授权人员列表
// (Device requests to download the list of authorized personnel)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DownloadPeopleList', async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN, Limit } = req.body;

    if (!SN) {
        // 如果SN为空，则返回错误 (If SN is empty, return an error)
        return res.status(400).json({ Success: 0, Message: '设备SN不能为空 (DeviceSN cannot be empty)' });
    }

    // 解析 Limit 参数，确保是数字，并设置默认/最大值
    // (Parse Limit parameter, ensure it's a number, and set default/max values)
    let parsedLimit = parseInt(Limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        parsedLimit = 50; // API文档中未明确默认值，暂定50 (API documentation doesn't specify default, tentatively set to 50)
    }
    parsedLimit = Math.min(parsedLimit, 1000); // API文档规定最大1000 (API documentation specifies max 1000)

    console.log(`设备 SN: ${SN} 请求下载人员列表，数量限制: ${parsedLimit}。 (Device SN: ${SN} requests download of personnel list, limit: ${parsedLimit}.)`);

    try {
        // 查询人员列表
        // (Query personnel list)
        // TODO: 根据实际的人员与设备关联逻辑调整查询条件。
        // (TODO: Adjust query conditions based on actual personnel-device association logic.)
        // 当前假设：任何已注册设备都可以下载平台上的（部分）人员。
        // (Current assumption: Any registered device can download (part of) the personnel on the platform.)
        // 如果人员是与特定设备SN绑定的 (例如通过 People schema 中的 deviceSNs 字段),
        // (If personnel are bound to specific device SNs (e.g., via deviceSNs field in People schema),)
        // 则查询应为: People.find({ deviceSNs: SN }).limit(parsedLimit);
        // (then the query should be: People.find({ deviceSNs: SN }).limit(parsedLimit);)
        // 为简化当前步骤，我们先假设一个全局可下载的列表，仅用Limit限制。
        // (To simplify the current step, we assume a globally downloadable list, limited only by Limit.)
        const peopleListFromDB = await People.find({}) // 示例：查找所有人员 (Example: find all personnel)
            .limit(parsedLimit)
            // .select('UserID Name Job Department IdentityCard Attachment Photo PhotoMD5 Password CardNum QRCode AccessType ExpirationDate OpenTimes KeepOpen Timegroup Holidays Elevators FaceFeature FaceFeatureMD5 Fingerprints Palmveins') // 选择API文档中定义的字段 (Select fields defined in API documentation)
            // 上面的select太长，且People模型字段已对应，lean()更合适
            // (The select above is too long, and People model fields already correspond; lean() is more appropriate)
            .lean(); // 使用 .lean() 获取普通JS对象，而不是Mongoose文档，可能更接近设备期望的纯净数据
                     // (Use .lean() to get plain JS objects instead of Mongoose documents, possibly closer to device's expected raw data)

        // Mongoose的 .lean() 会移除 Mongoose 特有的方法和虚拟属性，但仍会包含 _id 和 __v。
        // (Mongoose's .lean() removes Mongoose-specific methods and virtual properties, but will still include _id and __v.)
        // 如果设备端严格不接受这些字段，需要进一步转换。
        // (If the device strictly does not accept these fields, further transformation is needed.)
        // 例如: const transformedList = peopleListFromDB.map(p => { const { _id, __v, createdAt, updatedAt, ...rest } = p; return rest; });
        // (Example: const transformedList = peopleListFromDB.map(p => { const { _id, __v, createdAt, updatedAt, ...rest } = p; return rest; });)
        // 当前People模型已包含大部分所需字段，我们直接返回 lean() 的结果。
        // (The current People model already contains most required fields; we directly return the result of lean().)

        console.log(`为设备 SN: ${SN} 找到 ${peopleListFromDB.length} 条人员记录。 (Found ${peopleListFromDB.length} personnel records for device SN: ${SN}.)`);
        
        res.json({
            "Success": 1,
            "PeopleCount": peopleListFromDB.length,
            "PeopleList": peopleListFromDB 
        });

    } catch (error) {
        console.error(`为设备 SN: ${SN} 查询人员列表时发生错误 (Error querying personnel list for device SN: ${SN}):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误查询人员列表 (Server internal error querying personnel list)' });
    }
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
// @desc 设备上报其导入一批人员后的结果（成功、失败及原因）
// (Device reports the results after importing a batch of personnel (success, failure, and reasons))
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DownloadPeopleListResult', async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN, SuccessCount, FailCount, FailList } = req.body;

    if (!SN) {
        // 如果SN为空，则返回错误 (If SN is empty, return an error)
        return res.status(400).json({ Success: 0, Message: '设备SN不能为空 (DeviceSN cannot be empty)' });
    }

    try {
        // 打印接收到的设备SN和统计信息
        // (Print received device SN and statistics)
        console.log(`设备 SN: ${SN} 反馈拉取人员存储结果。 (Device SN: ${SN} reports result of storing downloaded personnel.)`);
        console.log(`导入成功数量 (Import success count): ${SuccessCount}, 导入失败数量 (Import fail count): ${FailCount}`);

        // 检查并打印失败列表详情
        // (Check and print failure list details)
        if (FailList && Array.isArray(FailList) && FailList.length > 0) {
            console.log(`失败详情 (${FailList.length} 条): (Failure details (${FailList.length} items):)`);
            FailList.forEach((failItem, index) => {
                // 打印每条失败记录的详细信息
                // (Print details of each failed record)
                console.log(`  ${index + 1}. 用户ID (User ID): ${failItem.UserID}, 错误码 (Error Code): ${failItem.ErrorCode}, 重复ID (Repeat ID): ${failItem.RepeatID || 'N/A'}, 错误信息 (Error Message): '${failItem.ErrMsg}'`);
            });
            // TODO: 在实际数据库操作中，可以将这些失败的详细信息存储到数据库 (例如 PeopleSyncLog 集合) 以供分析。
            // (In actual database operations, these failure details can be stored in the database (e.g., PeopleSyncLog collection) for analysis.)
        } else if (parseInt(FailCount, 10) > 0) {
            // 如果 FailCount 大于0 但 FailList 未提供或为空
            // (If FailCount is greater than 0 but FailList is not provided or is empty)
            console.log(`有 ${FailCount} 条导入失败的记录，但设备未提供详细的失败列表 (FailList)。 (There are ${FailCount} failed import records, but the device did not provide a detailed FailList.)`);
        }

        // TODO: 未来数据库交互步骤:
        // (Future database interaction steps:)
        // 1. 验证设备SN的合法性 (例如，查询 Device 集合)。
        //    (Validate the legitimacy of the device SN (e.g., query Device collection).)
        // 2. (可选) 将 SuccessCount, FailCount 以及 FailList 中的具体错误信息记录到数据库中。
        //    可以创建一个 PeopleSyncLog 集合来存储每次同步的日志，
        //    或者更新相关 People 文档的同步状态字段（如果适用）。
        //    (Optionally, record SuccessCount, FailCount, and specific error messages from FailList into the database.)
        //    (A PeopleSyncLog collection could be created to store logs of each synchronization,)
        //    (or update synchronization status fields of relevant People documents (if applicable).)
        // 对于当前步骤，我们仅做日志记录。
        // (For the current step, we only perform logging.)

        console.log(`已记录设备 SN: ${SN} 的人员列表下载结果日志。 (Log for personnel list download result from device SN: ${SN} has been recorded.)`);

        // 返回标准成功响应
        // (Return standard success response)
        res.json({
            "Success": 1 // 1 表示操作成功 (1 means operation successful)
        });

    } catch (error) {
        // 捕获处理请求过程中的意外错误
        // (Catch unexpected errors during request processing)
        console.error(`处理设备 SN: ${SN} 的人员下载结果时发生错误 (Error processing personnel download result for device SN: ${SN}):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误处理人员下载结果 (Server internal error processing personnel download result)' });
    }
});

// Helper function to map fields from personDetail (API format) to People schema format
// (辅助函数，用于将 personDetail (API格式) 中的字段映射到 People schema 格式)
// This is important if field names or structures differ.
// (如果字段名称或结构不同，这一点非常重要。)
function mapPersonDetailToSchema(detail, deviceSN) {
    // TODO: 根据 People schema 和 detail 的实际结构实现更完善的映射。
    // (Implement more complete mapping based on actual People schema and detail structure.)
    // 例如，日期转换、特定默认值处理等。
    // (For example, date conversion, specific default value handling, etc.)
    const mapped = {
        name: detail.Name,
        code: detail.Code, // 人员编号 (Personnel Code)
        job: detail.Job,
        department: detail.Department,
        identityCard: detail.IdentityCard,
        attachment: detail.Attachment, // 其他信息 (Other info)
        photo: detail.Photo, // 照片的URL或GridFS引用 (Photo URL or GridFS reference)
        photoMD5: detail.PhotoMD5,
        // 密码应在服务层单独处理加密，此处仅为示例 (Password should be handled for encryption at service layer, this is just an example)
        password: detail.Password, 
        cardNum: detail.CardNum,
        qrCode: detail.QRCode,
        accessType: detail.AccessType !== undefined ? detail.AccessType : 0, // 默认角色为0 (Default role is 0)
        // 权限截止日期: API文档中 0 表示无期限。Mongoose中Date类型字段为null通常也表示无期限。
        // (Expiration Date: In API docs, 0 means no limit. In Mongoose, null for Date type usually means no limit.)
        expirationDate: detail.ExpirationDate === 0 || detail.ExpirationDate === "0" ? null : (detail.ExpirationDate ? new Date(parseInt(detail.ExpirationDate, 10) * 1000) : null), // 假设设备发送Unix时间戳秒级 (Assuming device sends Unix timestamp in seconds)
        openTimes: detail.OpenTimes !== undefined ? detail.OpenTimes : 65535, // 默认65535次 (Default 65535 times)
        keepOpen: detail.KeepOpen !== undefined ? detail.KeepOpen : false, // 默认非持续开门 (Default not keep open)
        timegroupID: detail.Timegroup, // 注意API字段名 Timegroup, schema中是 timegroupID (Note API field name Timegroup, in schema it's timegroupID)
        holidays: detail.Holidays,
        elevators: detail.Elevators,
        faceFeature: detail.FaceFeature, // 人脸特征的URL或GridFS引用 (Face feature URL or GridFS reference)
        faceFeatureMD5: detail.FaceFeatureMD5,
        // 指纹和掌纹数据假设设备端发送的结构与 Mongoose schema 兼容
        // (Fingerprint and palm vein data: assuming structure sent by device is compatible with Mongoose schema)
        fingerprints: detail.Fingerprints, 
        palmveins: detail.Palmveins,
        // deviceSNs: [deviceSN] // 示例：如何将当前设备SN关联。更复杂的逻辑可能需要检查数组中是否已存在此SN。
                                // (Example: how to associate the current device SN. More complex logic might be needed to check if this SN already exists in the array.)
    };

    // 清理未定义的字段，避免将 undefined 存入数据库或覆盖已有值
    // (Clean up undefined fields to avoid storing undefined in the database or overwriting existing values)
    for (const key in mapped) {
        if (mapped[key] === undefined) {
            delete mapped[key];
        }
    }
    
    return mapped;
}


// 处理设备主动推送人员信息的请求
// @route POST /People/PushPeople
// @desc 设备在本地新增、修改或删除人员时，或响应服务器查询指令时，主动推送人员信息到平台
// (Device actively pushes personnel information to the platform when adding, modifying, or deleting personnel locally, or in response to a server query command)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/PushPeople', peopleUpload, async (req, res) => {
    const { SN, PushType, UserID, Detail } = req.body;
    // const photoFile = (req.files && req.files.Photo) ? req.files.Photo[0] : null; // 照片文件处理已延后 (Photo file handling deferred)

    if (!SN || !PushType || !UserID) {
        return res.status(400).json({ Success: 0, Message: '设备SN, PushType, 和 UserID 不能为空 (DeviceSN, PushType, and UserID cannot be empty)' });
    }

    const pushTypeInt = parseInt(PushType, 10);
    if (isNaN(pushTypeInt) || ![1, 2, 3, 4].includes(pushTypeInt)) {
        return res.status(400).json({ Success: 0, Message: '无效的 PushType 值 (Invalid PushType value)' });
    }

    let personDetail = null;
    if (Detail) {
        try {
            personDetail = JSON.parse(Detail);
        } catch (e) {
            console.error(`设备 SN: ${SN}, UserID: ${UserID}, 解析人员详情JSON失败 (Failed to parse personnel detail JSON):`, e);
            return res.status(400).json({ Success: 0, Message: '人员详情 (Detail) JSON 格式错误 (Personnel detail (Detail) JSON format error)' });
        }
    } else if (pushTypeInt !== 3) { // 删除(3)操作可能没有Detail字段 (Delete (3) operation might not have Detail field)
        // 对于新增(1)、更新(2)、查询响应(4)，Detail通常是需要的
        // (For Add(1), Update(2), Query Response(4), Detail is usually needed)
        // 但API文档说"人员不存在时，则无此字段"，这可能适用于查询响应(4)
        // (But API docs say "if personnel does not exist, this field is absent", which might apply to Query Response(4))
        // 如果是新增或更新，但没有Detail，则应报错
        // (If it's Add or Update without Detail, an error should be returned)
        if (pushTypeInt === 1 || pushTypeInt === 2) {
            console.log(`设备 SN: ${SN}, UserID: ${UserID}, PushType ${pushTypeInt} 需要 Detail 字段但未提供。 (PushType ${pushTypeInt} requires Detail field but not provided.)`);
            return res.status(400).json({ Success: 0, Message: '新增/更新操作缺少人员详情 (Detail) (Add/Update operation missing personnel detail (Detail))' });
        }
        console.log(`设备 SN: ${SN}, UserID: ${UserID}, PushType ${pushTypeInt} 无 Detail 字段。 (PushType ${pushTypeInt} has no Detail field.)`);
    }
    
    console.log(`设备 SN: ${SN} 推送人员信息。类型: ${pushTypeInt}, 用户ID: ${UserID}。 (Device SN: ${SN} pushing personnel info. Type: ${pushTypeInt}, UserID: ${UserID}.)`);

    try {
        let message = "";
        // 假设 UserID 在特定设备下是唯一的，或者 userID 本身是平台生成的全局唯一ID
        // (Assuming UserID is unique under a specific device, or userID itself is a platform-generated globally unique ID)
        // 如果 UserID 是设备本地ID，查询时应结合 SN: { userID: UserID, deviceSNs: SN }
        // (If UserID is a local device ID, query should combine SN: { userID: UserID, deviceSNs: SN })
        // 为简化，当前示例主要基于 UserID 操作，deviceSNs 的管理需要在 mapPersonDetailToSchema 和具体case中细化
        // (For simplicity, current example mainly operates based on UserID; deviceSNs management needs to be detailed in mapPersonDetailToSchema and specific cases)
        const query = { userID: UserID }; 

        switch (pushTypeInt) {
            case 1: // 新增 (Add)
                if (!personDetail) return res.status(400).json({ Success: 0, Message: '新增操作缺少人员详情 (Detail) (Add operation missing personnel detail (Detail))' });
                
                let existingPerson = await People.findOne(query);
                if (existingPerson) {
                    console.log(`设备 SN: ${SN}, UserID: ${UserID} 已存在，将执行更新逻辑。 (UserID ${UserID} already exists, will perform update logic.)`);
                    // 如果已存在，则执行类似 case 4 (查询响应/Upsert) 的逻辑
                    // (If exists, perform logic similar to case 4 (Query Response/Upsert))
                    const updateData = mapPersonDetailToSchema(personDetail, SN);
                    // 确保 deviceSNs 数组包含当前 SN
                    // (Ensure deviceSNs array includes current SN)
                    updateData.$addToSet = { deviceSNs: SN }; // 使用 $addToSet 避免重复添加 (Use $addToSet to avoid duplicate additions)
                    await People.findOneAndUpdate(query, updateData, { upsert: true, new: true, setDefaultsOnInsert: true });
                    message = `人员 ${UserID} 已存在，信息已更新/同步。 (Personnel ${UserID} already exists, information updated/synchronized.)`;
                } else {
                    const newPersonData = mapPersonDetailToSchema(personDetail, SN);
                    newPersonData.userID = UserID; // 确保 UserID 被设置 (Ensure UserID is set)
                    newPersonData.deviceSNs = [SN]; // 初始关联到当前设备 (Initially associate with current device)
                    
                    const newPerson = new People(newPersonData);
                    await newPerson.save();
                    message = `新增人员 ${UserID} 成功。 (Successfully added personnel ${UserID}.)`;
                }
                break;

            case 2: // 更新 (Update)
                if (!personDetail) return res.status(400).json({ Success: 0, Message: '更新操作缺少人员详情 (Detail) (Update operation missing personnel detail (Detail))' });
                
                const updatedDataForUpdate = mapPersonDetailToSchema(personDetail, SN);
                // 确保 deviceSNs 数组包含当前 SN (如果设备推送的人员信息需要关联到此设备)
                // (Ensure deviceSNs array includes current SN (if personnel info pushed by device needs to be associated with this device))
                updatedDataForUpdate.$addToSet = { deviceSNs: SN };
                
                const updatedPerson = await People.findOneAndUpdate(query, updatedDataForUpdate, { new: true });
                if (!updatedPerson) {
                    // 如果严格要求人员必须已存在才能更新，则返回404
                    // (If strictly requiring personnel to exist for update, return 404)
                    // 或者，如果希望如果不存在则创建，则可以使用 upsert:true (类似 case 4)
                    // (Alternatively, if wanting to create if not exists, use upsert:true (similar to case 4))
                    console.log(`设备 SN: ${SN}, UserID: ${UserID} 未找到，无法更新。 (UserID ${UserID} not found, cannot update.)`);
                    return res.status(404).json({ Success: 0, Message: `用户ID ${UserID} 未找到，无法更新 (UserID ${UserID} not found, cannot update)` });
                }
                message = `更新人员 ${UserID} 成功。 (Successfully updated personnel ${UserID}.)`;
                break;

            case 3: // 删除 (Delete)
                // 注意: "删除" 可能意味着从特定设备解除关联，或全局删除。
                // (Note: "Delete" might mean disassociating from a specific device, or global deletion.)
                // 当前实现为全局删除。如果需要解除关联，应使用 $pull 从 deviceSNs 数组移除 SN。
                // (Current implementation is global delete. If disassociation is needed, use $pull to remove SN from deviceSNs array.)
                const deletedPerson = await People.findOneAndDelete(query);
                if (!deletedPerson) {
                    console.log(`设备 SN: ${SN}, UserID: ${UserID} 未找到，无法删除。 (UserID ${UserID} not found, cannot delete.)`);
                    return res.status(404).json({ Success: 0, Message: `用户ID ${UserID} 未找到，无法删除 (UserID ${UserID} not found, cannot delete)` });
                }
                message = `删除人员 ${UserID} 成功。 (Successfully deleted personnel ${UserID}.)`;
                break;

            case 4: // 查询响应 (设备主动上报查询到的人员信息) - 执行 Upsert 逻辑
                    // (Query Response (device actively reports queried personnel info) - Perform Upsert logic)
                if (!personDetail) {
                     console.log(`设备 SN: ${SN}, UserID: ${UserID} 的查询响应无人员详情，可能设备本地无此人。不执行数据库操作。 (Query response for UserID ${UserID} has no personnel detail, possibly person not on device locally. No DB operation performed.)`);
                     message = `收到对 UserID ${UserID} 的查询响应，无详情提供。 (Received query response for UserID ${UserID}, no detail provided.)`;
                } else {
                    const upsertData = mapPersonDetailToSchema(personDetail, SN);
                    // 确保 deviceSNs 数组包含当前 SN
                    // (Ensure deviceSNs array includes current SN)
                    upsertData.$addToSet = { deviceSNs: SN };
                    await People.findOneAndUpdate(query, upsertData, { upsert: true, new: true, setDefaultsOnInsert: true });
                    message = `处理对 UserID ${UserID} 的查询响应并已同步/创建。 (Processed query response for UserID ${UserID} and synchronized/created.)`;
                }
                break;
            default:
                // 此处理论上不会到达，因为 pushTypeInt 已被验证
                // (Theoretically unreachable as pushTypeInt is already validated)
                return res.status(500).json({ Success: 0, Message: '内部错误：未知的 PushType (Internal error: Unknown PushType)' }); 
        }
        console.log(`设备 SN: ${SN} - ${message}`);
        res.json({ Success: 1, Message: message });

    } catch (error) {
        console.error(`设备 SN: ${SN}, 处理 PushPeople (UserID: ${UserID}, Type: ${pushTypeInt}) 时发生错误 (Error processing PushPeople):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误处理人员推送 (Server internal error processing personnel push)' });
    }
});

// 导出路由模块
// Export the router module
module.exports = router;
