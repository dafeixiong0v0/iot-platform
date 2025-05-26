// 导入 Express 框架
// Import the Express framework
const express = require('express');
// 创建路由实例
// Create a router instance
const router = express.Router();

// 导入 Mongoose 模型
// Import Mongoose models
const Device = require('../models/device'); // 引入Device模型 (Import Device model)
const DeviceStatus = require('../models/deviceStatus'); // 引入DeviceStatus模型 (Import DeviceStatus model)
const People = require('../models/people'); // 引入People模型 (Import People model)
const RemoteCommandQueue = require('../models/remoteCommandQueue'); // 引入RemoteCommandQueue模型 (Import RemoteCommandQueue model)

// 导入 multer 用于处理 multipart/form-data
// Import multer for handling multipart/form-data
const multer = require('multer');

// 为 /Device/RegisterIdentifyTicketResult 配置 multer
// Configure multer for /Device/RegisterIdentifyTicketResult
const uploadResultJsonAndPhoto = multer().fields([{ name: 'ResultJson', maxCount: 1 }, { name: 'Photo', maxCount: 1 }]);

// 为 /Device/UploadSnapshoot 配置 multer
// Configure multer for /Device/UploadSnapshoot
const uploadSnapshoot = multer().fields([{ name: 'SN', maxCount: 1 }, { name: 'Photo', maxCount: 1 }]);

// 为 /Device/RequestAuthorization 配置 multer
// Configure multer for /Device/RequestAuthorization
const uploadAuthRequest = multer().fields([
    { name: 'SN', maxCount: 1 },
    { name: 'RecordDetail', maxCount: 1 }, // JSON string
    { name: 'Photo', maxCount: 1 }         // Optional photo file
]);

// 处理设备心跳包请求
// @route POST /Device/Keepalive
// @desc 设备发送心跳以保持连接、更新状态并检查指令
// (Device sends keepalive to maintain connection, update status, and check for commands)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/Keepalive', async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN, RelayStatus, KeepOpenStatus, DoorSensorStatus, LockDoorStatus, AlarmStatus } = req.body;
    
    // 获取设备上报的IP地址
    // Get IP address reported by the device
    // 注意: req.ip 依赖 Express 的 'trust proxy' 设置, req.connection?.remoteAddress 更原始
    // (Note: req.ip depends on Express 'trust proxy' setting, req.connection?.remoteAddress is more raw)
    // 简化处理，直接从请求中获取，或由反向代理设置到header中
    // (Simplified handling, get directly from request, or set in header by reverse proxy)
    let clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    if (clientIp && clientIp.includes(',')) { // 如果有多个代理，取第一个 (If multiple proxies, take the first one)
        clientIp = clientIp.split(',')[0].trim();
    }
    if (clientIp && (clientIp.startsWith('::ffff:') || clientIp.startsWith('::1'))) { // 处理IPv6环回/映射地址 (Handle IPv6 loopback/mapped address)
        clientIp = clientIp.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
    }

    // 校验SN是否存在
    // Validate if SN exists
    if (!SN) {
        console.log('设备心跳请求失败: SN为空。请求来源IP: (Device keepalive request failed: SN is empty. Request source IP:)', clientIp, '请求体 (Request body):', req.body);
        return res.status(400).json({ Success: 0, Message: '设备SN不能为空' }); // Device SN cannot be empty
    }

    try {
        // 查找或创建设备记录
        // (Find or create device record)
        // 使用 findOneAndUpdate 的 upsert 功能简化查找或创建
        // (Use findOneAndUpdate's upsert feature to simplify find or create)
        const device = await Device.findOneAndUpdate(
            { deviceSN: SN }, // 查询条件 (Query condition)
            { $setOnInsert: { deviceSN: SN, ipAddress: clientIp, deviceName: `Device_${SN}` } }, // $setOnInsert 仅在文档创建时设置这些值 (仅在创建时设置ipAddress和deviceName)
                                                                                             // ($setOnInsert only sets these values when the document is created - only set ipAddress and deviceName on creation)
            { upsert: true, new: true, setDefaultsOnInsert: true } // 选项: 找不到则创建, 返回更新后的文档, 创建时应用默认值
                                                                  // (Options: create if not found, return updated document, apply defaults on creation)
        );
        console.log(`设备 SN: ${SN} 心跳处理 - 设备记录已确认/创建 (Device SN: ${SN} keepalive processed - Device record confirmed/created).`);

        // 更新或创建设备状态记录
        // (Update or create device status record)
        const deviceStatusUpdate = {
            deviceSN: SN,
            onlineStatus: true,
            lastKeepaliveAt: new Date(),
            ipAddress: clientIp, // 记录本次心跳的IP地址 (Record IP address of this keepalive)
            RelayStatus,
            KeepOpenStatus,
            DoorSensorStatus,
            LockDoorStatus,
            AlarmStatus
        };
        await DeviceStatus.findOneAndUpdate(
            { deviceSN: SN }, // 查询条件 (Query condition)
            deviceStatusUpdate, // 更新内容 (Update content)
            { upsert: true, new: true, setDefaultsOnInsert: true } // 选项 (Options)
        );
        console.log(`设备 SN: ${SN} 的状态已更新。在线状态: true, IP: ${clientIp} (Device SN: ${SN} status updated. Online status: true, IP: ${clientIp})`);
        // 原始状态打印，用于调试 (Original status print for debugging)
        // console.log(`  设备状态: RelayStatus=${RelayStatus}, KeepOpenStatus=${KeepOpenStatus}, DoorSensorStatus=${DoorSensorStatus}, LockDoorStatus=${LockDoorStatus}, AlarmStatus='${AlarmStatus}'`);

        // 检查待处理的远程命令
        // (Check for pending remote commands)
        let syncParameterFlag = 0;
        let remoteCommandFlag = 0;

        // 查询 RemoteCommandQueue 集合中是否有针对此SN的待处理指令
        // (Query the RemoteCommandQueue collection for pending commands for this SN)
        // Updated query to include retryCount < maxRetries condition
        const pendingCommands = await RemoteCommandQueue.find({
            deviceSN: SN,
            status: 'Pending', // 仅查找状态为 'Pending' 的命令 (Only find commands with status 'Pending')
            $expr: { $lt: ['$retryCount', '$maxRetries'] } // 确保 retryCount 小于 maxRetries (Ensure retryCount is less than maxRetries)
        }).sort({ priority: -1, createdAt: 1 }).lean(); // 按优先级高到低，然后按创建时间先到先执行
                                                        // (Sort by priority high to low, then by creation time first to execute)

        if (pendingCommands && pendingCommands.length > 0) {
            console.log(`设备 SN: ${SN} 发现 ${pendingCommands.length} 条符合条件(未超重试次数)的待处理命令。 (Device SN: ${SN} found ${pendingCommands.length} eligible (not exceeding retry limit) pending commands.)`);
            for (const cmd of pendingCommands) {
                if (cmd.commandType === 'SyncParameter') {
                    syncParameterFlag = 1;
                    console.log(`设备 SN: ${SN} - 检测到待处理的 SyncParameter 命令。 (Detected pending SyncParameter command.)`);
                } else {
                    // 任何其他类型的命令都通过 Remote:1 标志，由 /Device/RemoteCommand 接口处理
                    // (Any other type of command is indicated by Remote:1 flag, handled by /Device/RemoteCommand interface)
                    remoteCommandFlag = 1;
                    console.log(`设备 SN: ${SN} - 检测到待处理的 ${cmd.commandType} 命令，将通过 RemoteCommand 处理。 (Detected pending ${cmd.commandType} command, will be processed via RemoteCommand.)`);
                }
                // 如果只需要知道是否有这两种类型的命令，可以提前跳出循环
                // (If only need to know if these two types of commands exist, can break the loop early)
                if (syncParameterFlag === 1 && remoteCommandFlag === 1) break; 
            }
        } else {
            console.log(`设备 SN: ${SN} 无待处理的远程命令。 (Device SN: ${SN} has no pending remote commands.)`);
        }

        // 返回标准响应，包含命令标志
        // (Return standard response, including command flags)
        res.json({
            "Success": 1,
            "AddPeople": 0, // TODO: 此标志可能基于人员同步状态而非RemoteCommandQueue (This flag might be based on personnel sync status, not RemoteCommandQueue)
            "DeletePeople": 0, // TODO: 此标志可能基于人员同步状态而非RemoteCommandQueue (This flag might be based on personnel sync status, not RemoteCommandQueue)
            "SyncParameter": syncParameterFlag,
            "Remote": remoteCommandFlag,
            "UploadWorkParameter": 0 // TODO: 如果需要，也可以通过命令队列触发此操作 (If needed, this operation can also be triggered via command queue)
        });

    } catch (error) {
        console.error(`处理设备 SN: ${SN} 的心跳时发生错误 (Error processing keepalive for device SN: ${SN}):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误处理心跳' }); // Server internal error processing keepalive
    }
});

// 处理设备在线鉴权请求
// @route POST /Device/RequestAuthorization
// @desc 设备请求服务器进行实时在线鉴权 (例如：开门请求)
// (Device requests real-time online authorization from the server (e.g., door open request))
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/RequestAuthorization', uploadAuthRequest, async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN, RecordDetail } = req.body;
    // const photoFile = (req.files && req.files.Photo) ? req.files.Photo[0] : null; // 照片文件处理已延后 (Photo file handling deferred)

    if (!SN || !RecordDetail) {
        // 如果SN或记录详情为空，则返回错误 (If SN or record detail is empty, return an error)
        return res.status(400).json({ Success: 0, Message: '设备SN和记录详情不能为空 (DeviceSN and RecordDetail cannot be empty)' });
    }

    let recordDetailJson;
    try {
        recordDetailJson = JSON.parse(RecordDetail);
    } catch (e) {
        console.error(`设备 SN: ${SN}, 解析鉴权记录详情JSON失败 (Failed to parse authorization record detail JSON):`, e);
        return res.status(400).json({ Success: 0, Message: '记录详情 (RecordDetail) JSON 格式错误 (RecordDetail JSON format error)' });
    }

    // 从解析后的JSON中获取 UserID, CardNum, RecordType 等信息
    // (Get UserID, CardNum, RecordType, etc. from parsed JSON)
    const { UserID, CardNum, RecordType } = recordDetailJson; 
    console.log(`设备 SN: ${SN} 在线鉴权请求: UserID='${UserID || 'N/A'}', CardNum='${CardNum || 'N/A'}', RecordType=${RecordType}`);

    try {
        let personQuery = {};
        // 构建人员查询条件
        // (Build personnel query condition)
        // TODO: 考虑 UserID 和 CardNum 的唯一性以及是否需要与 deviceSNs 关联查询
        // (TODO: Consider uniqueness of UserID and CardNum and whether to query in association with deviceSNs)
        // 例如: 如果 UserID 是设备本地ID, 查询应为 { userID: UserID, deviceSNs: SN }
        // (For example: if UserID is a local device ID, query should be { userID: UserID, deviceSNs: SN })
        if (UserID) {
            personQuery = { userID: UserID };
        } else if (CardNum) {
            personQuery = { cardNum: CardNum };
        } else {
            // 如果既没有UserID也没有CardNum，则无法进行人员查找
            // (If neither UserID nor CardNum is provided, personnel lookup cannot be performed)
            return res.status(400).json({ Success: 0, Message: '鉴权请求中缺少UserID或CardNum (Missing UserID or CardNum in authorization request)' });
        }

        // 查询人员信息
        // (Query personnel information)
        const person = await People.findOne(personQuery).lean(); // 使用 .lean() 获取普通JS对象 (Use .lean() to get plain JS object)

        if (!person) {
            // 如果未找到人员
            // (If person not found)
            // TODO: 根据 RecordType 判断是否需要记录为“未注册用户”事件到 IdentifyRecord 集合
            // (TODO: Based on RecordType, determine if it needs to be recorded as an "unregistered user" event in IdentifyRecord collection)
            console.log(`设备 SN: ${SN}, 鉴权失败: 人员未注册 (UserID: ${UserID || 'N/A'}, CardNum: ${CardNum || 'N/A'})。 (Auth failed: Person not registered.)`);
            return res.json({ Success: 0, Message: '人员未注册 (Person not registered)' });
        }

        // 1. 检查黑名单 (Check blacklist)
        if (person.accessType === 2) { // 2 表示黑名单 (2 means blacklist)
            console.log(`设备 SN: ${SN}, 鉴权失败: 人员 ${person.name} (UserID: ${person.userID}) 在黑名单中。 (Auth failed: Person ${person.name} is blacklisted.)`);
            return res.json({ Success: 0, Message: '黑名单人员，禁止通行 (Blacklisted, access denied)' });
        }
        
        // 2. 检查有效期 (0 或 null 表示无期限) (Check expiration date - 0 or null means no limit)
        if (person.expirationDate && new Date(person.expirationDate) < new Date()) {
            console.log(`设备 SN: ${SN}, 鉴权失败: 人员 ${person.name} (UserID: ${person.userID}) 权限已过期 (${person.expirationDate})。 (Auth failed: Person ${person.name}'s permission expired.)`);
            return res.json({ Success: 0, Message: '权限已过期 (Permission expired)' });
        }

        // 3. 检查开门次数 (0 表示禁止通行, 65535 表示无限制) (Check open times - 0 means prohibited, 65535 means unlimited)
        if (person.openTimes === 0) {
            console.log(`设备 SN: ${SN}, 鉴权失败: 人员 ${person.name} (UserID: ${person.userID}) 有效次数已用尽。 (Auth failed: Person ${person.name}'s open times exhausted.)`);
            return res.json({ Success: 0, Message: '有效次数已用尽 (Open times exhausted)' });
        }
        // TODO: 如果 openTimes 不是65535 (无限制)，并且本次验证通过，则需要将 openTimes 减1。
        // (If openTimes is not 65535 (unlimited) and this verification passes, openTimes needs to be decremented by 1.)
        // 例如: if (person.openTimes < 65535) { await People.updateOne(personQuery, { $inc: { openTimes: -1 } }); }
        // (For example: if (person.openTimes < 65535) { await People.updateOne(personQuery, { $inc: { openTimes: -1 } }); })
        // 这需要考虑并发和事务性，或者接受最终一致性。当前步骤暂不实现减次数。
        // (This needs to consider concurrency and atomicity, or accept eventual consistency. Decrementing times is not implemented in the current step.)

        // 4. TODO: 检查开门时段 (Timegroup) 和节假日 (Holidays)
        // (TODO: Check door open time slots (Timegroup) and holidays (Holidays))
        // 这部分逻辑较复杂，需要解析 Timegroup 字符串 (例如 "0,0,0,0,0,0,0,1,0800,1700,0800,1700,0800,1700,0800,1700,0800,1700,0800,1700,0800,1700")
        // (This part is complex, requiring parsing of Timegroup string (e.g., "0,0,0,0,0,0,0,1,0800,1700,..."))
        // 并与当前时间比较，同时检查 Holidays 列表。
        // (and comparing with current time, while also checking Holidays list.)
        // 示例: const accessGrantedByTime = checkTimegroup(person.timegroupID, person.holidays, new Date());
        // (Example: const accessGrantedByTime = checkTimegroup(person.timegroupID, person.holidays, new Date());)
        // if (!accessGrantedByTime) {
        //     console.log(`设备 SN: ${SN}, 鉴权失败: 人员 ${person.name} (UserID: ${person.userID}) 不在授权时间范围内。`);
        //     return res.json({ Success: 0, Message: '不在授权时间范围内 (Not within authorized time range)' });
        // }
        console.log(`人员 ${person.name} (UserID: ${person.userID}, CardNum: ${person.cardNum || 'N/A'}) 通过了基础验证。时段和节假日检查暂未实现。 (Person passed basic checks. Time slot and holiday checks not yet implemented.)`);

        // 如果所有检查都通过 (If all checks pass)
        // Success: 1 表示鉴权成功，开门并显示鉴权消息
        // Success: 2 表示鉴权成功，开门但不显示消息 (例如，对于已授权的常开卡)
        // (Success: 1 means auth successful, open door and display message)
        // (Success: 2 means auth successful, open door but do not display message (e.g., for authorized keep-open card))
        // 当前默认返回 Success: 1 (Currently defaults to Success: 1)
        res.json({ Success: 1, Message: `验证通过: ${person.name || ''} (Verification successful: ${person.name || ''})` });

    } catch (error) {
        console.error(`设备 SN: ${SN}, 处理在线鉴权时发生错误 (Error processing online authorization for device SN: ${SN}):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误处理在线鉴权 (Server internal error processing online authorization)' });
    }
});

// 处理设备反馈人员注册凭证的结果
// @route POST /Device/RegisterIdentifyTicketResult
// @desc 设备上报人员凭证注册（如人脸、卡号）的操作结果，可能包含照片 (Device reports the result of personnel credential registration (e.g., face, card number), may include photo)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
// 使用 multer 中间件来处理 multipart/form-data (Use multer middleware to handle multipart/form-data)
router.post('/RegisterIdentifyTicketResult', uploadResultJsonAndPhoto, (req, res) => {
    console.log('接收到设备凭证注册结果的请求。 (Received request for device credential registration result.)');

    let resultJson = {};

    // 检查 ResultJson 字段
    // Check for ResultJson field
    if (req.body.ResultJson) {
        try {
            // 解析 ResultJson 字符串为 JSON 对象
            // Parse ResultJson string to JSON object
            resultJson = JSON.parse(req.body.ResultJson);
            console.log(`设备 SN: ${resultJson.SN} 上报了凭证注册结果。 (Device SN: ${resultJson.SN} reported credential registration result.)`);
            console.log(`注册用户ID (User ID): ${resultJson.UserID}, 注册结果 (Result): ${resultJson.Result}`);
            if (resultJson.Result === 3) { // 3--注册信息重复 (3 -- registration information is duplicated)
                 console.log(`凭证重复，重复的用户ID (Credential duplicated, duplicated User ID): ${resultJson.RepetitionUserID}`);
            }
        } catch (error) {
            console.error("解析 ResultJson 失败 (Failed to parse ResultJson):", error);
            // 可以选择返回错误响应
            // Optionally return an error response
            // return res.status(400).json({ Success: 0, Message: "ResultJson格式错误 (ResultJson format error)" });
        }
    } else {
        console.log("请求中未找到 ResultJson 字段。 (ResultJson field not found in request.)");
    }

    // 检查 Photo 字段
    // Check for Photo field
    if (req.files && req.files.Photo && req.files.Photo[0]) {
        console.log(`设备上传了注册照片 (Device uploaded registration photo): ${req.files.Photo[0].originalname}, 大小 (Size): ${req.files.Photo[0].size} bytes`);
        // TODO: 在后续步骤中，这里将包含照片文件的处理逻辑，例如保存到 GridFS 或文件系统
        // In subsequent steps, this will include logic for handling the photo file, e.g., saving to GridFS or filesystem.
    }

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 根据 ResultJson.Result 更新人员信息 (People 集合) 或记录相关事件 (Update personnel information (People collection) or record relevant events based on ResultJson.Result)
    // 3. 如果注册成功且有 UserDetail，可能需要更新人员的详细信息及照片/特征码链接 (If registration is successful and UserDetail is present, may need to update detailed personnel information and photo/feature code links)

    // 返回标准成功响应
    // Return standard success response
    res.json({
        "Success": 1
    });
});

// 处理设备上传摄像头快照的请求
// @route POST /Device/UploadSnapshoot
// @desc 设备上传摄像头快照，通常响应远程指令 (Device uploads camera snapshot, usually in response to a remote command)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UploadSnapshoot', uploadSnapshoot, (req, res) => {
    console.log('接收到设备快照上传请求。 (Received device snapshot upload request.)');

    const deviceSN = req.body.SN; // SN 现在从 req.body 中获取，因为它是表单字段 (SN is now obtained from req.body as it's a form field)

    if (deviceSN) {
        console.log(`设备 SN: ${deviceSN} 正在上传快照。 (Device SN: ${deviceSN} is uploading a snapshot.)`);
    } else {
        console.log("请求中未找到设备 SN 字段。 (Device SN field not found in request.)");
        // 如果SN是必需的，可以考虑返回错误 (If SN is mandatory, consider returning an error)
        // return res.status(400).json({ Success: 0, Message: "缺少设备SN (Missing device SN)" });
    }

    // 检查 Photo 字段
    // Check for Photo field
    if (req.files && req.files.Photo && req.files.Photo[0]) {
        // 确保 deviceSN 存在才使用它，否则日志中会是 undefined (Ensure deviceSN exists before using it, otherwise it will be undefined in logs)
        const snForLog = deviceSN || "未知设备 (Unknown Device)";
        console.log(`设备 SN: ${snForLog} 上传了快照文件: ${req.files.Photo[0].originalname}, 大小: ${req.files.Photo[0].size} bytes`);
        // TODO: 在后续步骤中，这里将包含快照文件的处理逻辑，例如保存到 GridFS 或特定目录，并可能关联到设备或事件
        // In subsequent steps, this will include logic for handling the snapshot file, e.g., saving to GridFS or a specific directory, and possibly associating it with the device or event.
    } else {
        console.log("快照上传请求中未找到 Photo 文件。 (Photo file not found in snapshot upload request.)");
        // 根据实际需求，如果照片是必须的，可以返回错误
        // Depending on actual requirements, if the photo is mandatory, an error can be returned.
        // return res.status(400).json({ Success: 0, Message: "缺少照片文件 (Missing photo file)" });
    }

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. (如果适用) 将快照信息与请求来源（如远程命令ID）关联起来 ((If applicable) Associate snapshot information with the request source (e.g., remote command ID))
    // 3. 将文件保存到持久化存储 (Save the file to persistent storage)

    // 返回标准成功响应
    // Return standard success response
    res.json({
        "Success": 1
    });
});

// 处理设备获取远程操作指令的请求
// @route POST /Device/RemoteCommand
// @desc 设备在收到心跳包中 Remote=1 指令后，请求此接口获取具体的远程操作命令
// (After receiving Remote=1 in heartbeat, device requests this interface for specific remote commands)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/RemoteCommand', async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN } = req.body;

    if (!SN) {
        // 如果SN为空，则返回错误 (If SN is empty, return an error)
        return res.status(400).json({ Success: 0, Message: '设备SN不能为空 (DeviceSN cannot be empty)' });
    }
    console.log(`设备 SN: ${SN} 请求远程操作指令。 (Device SN: ${SN} requests remote operation command.)`);

    // 定义辅助函数以查找和处理命令，包括重试逻辑
    // Define helper function to find and process commands, including retry logic
    async function findAndProcessCommand(deviceSN, excludedCommandIds = []) {
        const query = {
            deviceSN: deviceSN,
            status: 'Pending' // 仅查找状态为 'Pending' 的命令 (Only find commands with status 'Pending')
        };
        if (excludedCommandIds.length > 0) {
            query._id = { $nin: excludedCommandIds }; // 排除已处理（失败）的命令ID (Exclude processed (failed) command IDs)
        }

        const commandToExecute = await RemoteCommandQueue.findOne(query)
            .sort({ priority: -1, createdAt: 1 }); // 按优先级高到低，然后按创建时间先到先执行 (Sort by priority high to low, then by creation time first to execute)

        if (!commandToExecute) {
            return null; // 没有找到命令 (No command found)
        }

        const maxRetries = commandToExecute.maxRetries || 3; // 如果命令上没有定义maxRetries，则默认为3 (Default to 3 if maxRetries is not defined on the command)
        const currentRetryCount = commandToExecute.retryCount || 0;

        if (currentRetryCount >= maxRetries) {
            // 达到或超过最大重试次数 (Reached or exceeded max retries)
            commandToExecute.status = 'Failed';
            commandToExecute.errorMessage = `Max retries (${maxRetries}) reached. Command not sent.`;
            commandToExecute.lastUpdatedAt = new Date(); // 记录失败时间 (Record failure time)
            await commandToExecute.save();
            console.log(`命令 ${commandToExecute._id} 为设备 ${deviceSN} 因达到最大重试次数(${maxRetries})而失败。 (Command ${commandToExecute._id} for device ${deviceSN} failed due to max retries (${maxRetries}).)`);
            
            // 尝试查找下一个命令 (Try to find the next command)
            return findAndProcessCommand(deviceSN, [...excludedCommandIds, commandToExecute._id]);
        }

        // 命令符合发送条件 (Command is eligible for sending)
        return commandToExecute;
    }

    try {
        const commandToExecute = await findAndProcessCommand(SN);

        if (commandToExecute) {
            console.log(`设备 SN: ${SN} - 发现待执行命令: ${commandToExecute.commandType}, ID: ${commandToExecute._id}, Payload: ${JSON.stringify(commandToExecute.commandPayload)}`);
            // (Device SN: ${SN} - Found pending command: ${commandToExecute.commandType}, ID: ${commandToExecute._id}, Payload: ${JSON.stringify(commandToExecute.commandPayload)})

            const responsePayload = { Success: 1 };
            const payload = commandToExecute.commandPayload || {}; // 确保 payload 至少是一个空对象 (Ensure payload is at least an empty object)

            // 根据命令类型构建特定的响应字段
            // (Construct specific response fields based on command type)
            switch (commandToExecute.commandType) {
                case 'Restart':
                    responsePayload.Restart = payload.value !== undefined ? payload.value : 1;
                    break;
                case 'Recover':
                    responsePayload.Recover = payload.value !== undefined ? payload.value : 1;
                    break;
                case 'Opendoor':
                    responsePayload.Opendoor = payload.value !== undefined ? payload.value : 1; 
                    break;
                case 'Closealarm':
                    responsePayload.Closealarm = payload.value !== undefined ? payload.value : 1;
                    break;
                case 'RepostRecord':
                     responsePayload.RepostRecord = payload.value !== undefined ? payload.value : 1;
                     break;
                case 'PushAllPeople':
                    responsePayload.PushAllPeople = payload.value !== undefined ? payload.value : 1;
                    break;
                case 'QueryPeople':
                    responsePayload.QueryPeople = payload.userIDs || [];
                    break;
                case 'ClearRecord':
                    responsePayload.ClearRecord = payload.value !== undefined ? payload.value : 1;
                    break;
                case 'RegisterIdentifyTicket':
                    responsePayload.RegisterIdentifyTicket = payload;
                    break;
                case 'PushSoftware':
                    responsePayload.PushSoftware = payload;
                    break;
                case 'PushSystemFile':
                    responsePayload.PushSystemFile = payload;
                    break;
                case 'Snapshoot':
                     responsePayload.Snapshoot = payload.value !== undefined ? payload.value : 1;
                     break;
                default:
                    console.warn(`设备 SN: ${SN} - 未知或未在switch中处理的命令类型: ${commandToExecute.commandType} (ID: ${commandToExecute._id})`);
                    // (Device SN: ${SN} - Unknown or unhandled command type in switch: ${commandToExecute.commandType} (ID: ${commandToExecute._id}))
                    break; 
            }

            // 更新命令状态：标记为已发送，增加重试次数
            // (Update command status: mark as sent, increment retry count)
            commandToExecute.status = 'Sent';
            commandToExecute.lastAttemptAt = new Date();
            commandToExecute.retryCount = (commandToExecute.retryCount || 0) + 1;
            commandToExecute.lastUpdatedAt = new Date(); // 记录状态更新时间 (Record status update time)
            await commandToExecute.save();

            console.log(`设备 SN: ${SN} - 命令 ${commandToExecute.commandType} (ID: ${commandToExecute._id}) 已发送 (尝试次数: ${commandToExecute.retryCount})。响应: ${JSON.stringify(responsePayload)}`);
            // (Device SN: ${SN} - Command ${commandToExecute.commandType} (ID: ${commandToExecute._id}) has been sent (Attempt: ${commandToExecute.retryCount}). Response: ${JSON.stringify(responsePayload)})
            res.json(responsePayload);

        } else {
            // 如果没有找到符合条件的待处理命令 (If no eligible pending command found)
            console.log(`设备 SN: ${SN} 无符合条件的待处理远程操作指令。 (Device SN: ${SN} has no eligible pending remote operation commands.)`);
            res.json({
                "Success": 1,
                "Message": "当前无待处理的远程操作指令 (Currently no pending remote operation commands)"
            });
        }
    } catch (error) {
        console.error(`设备 SN: ${SN}, 处理远程指令请求时发生错误 (Error processing remote command request for device SN: ${SN}):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误处理远程指令 (Server internal error processing remote commands)' });
    }
});

// 处理设备下载工作参数的请求
// @route POST /Device/DownloadWorkSetting
// @desc 设备在收到心跳包中 SyncParameter=1 指令后，请求此接口下载最新配置
// (Device requests this interface to download the latest configuration after receiving SyncParameter=1 command in the heartbeat package)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DownloadWorkSetting', async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { SN } = req.body;

    if (!SN) {
        // 如果SN为空，则返回错误 (If SN is empty, return an error)
        return res.status(400).json({ Success: 0, Message: '设备SN不能为空 (DeviceSN cannot be empty)' });
    }

    try {
        // 根据设备SN从数据库查找设备文档
        // (Find the device document from the database based on device SN)
        const device = await Device.findOne({ deviceSN: SN });

        if (!device) {
            // 如果未找到设备 (If device is not found)
            console.log(`设备 SN: ${SN} 请求下载参数，但设备未在数据库中找到。 (Device SN: ${SN} requested download parameters, but device not found in database.)`);
            return res.status(404).json({ Success: 0, Message: '设备未注册或未找到 (Device not registered or not found)' });
        }

        // 检查设备是否有已存储的工作参数 (workSettings)
        // (Check if the device has stored work parameters (workSettings))
        // Object.keys().length > 0 用于确保 workSettings 不是一个空对象 {}
        // (Object.keys().length > 0 is used to ensure workSettings is not an empty object {})
        if (device.workSettings && typeof device.workSettings === 'object' && Object.keys(device.workSettings).length > 0) {
            console.log(`为设备 SN: ${SN} 返回已存储的工作参数。 (Returning stored work parameters for device SN: ${SN}.)`);
            // 成功找到设备且有参数，返回 Success:1 和 workSettings
            // (Successfully found device and parameters exist, return Success:1 and workSettings)
            // workSettings 应该已经包含了设备期望的完整结构，因为它是由 UploadWorkSetting 的 req.body 整体存入的
            // (workSettings should already contain the complete structure expected by the device, as it was stored from the entire req.body of UploadWorkSetting)
            res.json({
                "Success": 1,
                ...device.workSettings 
            });
        } else {
            // 设备存在，但没有有效的 workSettings
            // (Device exists, but no valid workSettings)
            console.log(`设备 SN: ${SN} 存在，但无工作参数配置或参数为空。返回提示信息。 (Device SN: ${SN} exists, but no work parameter configuration or parameters are empty. Returning informational message.)`);
            res.json({
                "Success": 1, // 即使没有参数，操作本身是成功的 (Even if no parameters, the operation itself is successful)
                "Message": "设备参数尚未配置或为空 (Device parameters not yet configured or empty)",
                "DeviceSN": SN // 包含设备SN，让设备知道是针对它的响应 (Include deviceSN so the device knows it's a response for it)
                // 注意: 根据API文档，设备通常期望接收到一个完整的参数结构。
                // (Note: According to API documentation, devices usually expect to receive a complete parameter structure.)
                // 在实际应用中，如果 workSettings 为空，可能需要返回一个包含所有字段的、预定义的默认参数结构。
                // (In a real application, if workSettings is empty, it might be necessary to return a predefined default parameter structure containing all fields.)
                // 为简化当前步骤，我们仅返回消息。后续可以根据具体需求扩展此处的默认参数。
                // (To simplify the current step, we only return a message. Default parameters here can be expanded later based on specific needs.)
            });
        }

    } catch (error) {
        console.error(`为设备 SN: ${SN} 查询工作参数时发生错误 (Error querying work parameters for device SN: ${SN}):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误查询设备参数 (Server internal error querying device parameters)' });
    }
});

// 处理设备上传工作参数的请求
// @route POST /Device/UploadWorkSetting
// @desc 设备上传其当前的工作参数设置 (Device uploads its current work parameter settings)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UploadWorkSetting', async (req, res) => { // 转换为 async 函数 (Converted to async function)
    const { DeviceSN } = req.body; // 主 DeviceSN 用于查询 (Main DeviceSN for query)
    // 完整的 req.body 包含了所有工作参数，我们将其存入 workSettings 字段
    // (The complete req.body contains all work parameters, we will store it in the workSettings field)

    if (!DeviceSN) {
        // 如果请求体中没有DeviceSN，则无法处理 (If DeviceSN is not in the request body, it cannot be processed)
        console.log('设备工作参数上传请求失败: DeviceSN为空。请求体 (Device work parameter upload request failed: DeviceSN is empty. Request body):', req.body);
        return res.status(400).json({ Success: 0, Message: '设备SN不能为空 (DeviceSN cannot be empty)' });
    }

    try {
        // 查找并更新设备的工作参数
        // (Find and update the device's work parameters)
        // 如果设备不存在，upsert:true 会根据 DeviceSN 创建新设备
        // (If the device does not exist, upsert:true will create a new device based on DeviceSN)
        // 并将 req.body 整体存入 workSettings 字段
        // (And store the entire req.body into the workSettings field)
        const updatedDevice = await Device.findOneAndUpdate(
            { deviceSN: DeviceSN }, // 查询条件 (Query condition)
            { 
                $set: { // 使用 $set 操作符更新字段 (Use $set operator to update fields)
                    workSettings: req.body, // 将整个请求体作为工作参数存下来 (Store the entire request body as work parameters)
                    deviceName: req.body.DeviceName || `Device_${DeviceSN}`, // 如果参数中有DeviceName则使用，否则生成一个 (Use DeviceName from parameters if present, otherwise generate one)
                    firmwareVersion: req.body.FirmwareVerson, // 示例：也可以提取特定参数更新到顶层字段 (Example: specific parameters can also be extracted and updated to top-level fields)
                    // 根据设备schema，httpClientServerAddr 和 httpClientKeepaliveTime 也在顶层
                    // (According to device schema, httpClientServerAddr and httpClientKeepaliveTime are also top-level)
                    httpClientServerAddr: req.body.HTTPClient?.ServerAddr, // 从嵌套结构中提取 (Extract from nested structure)
                    httpClientKeepaliveTime: req.body.HTTPClient?.KeepaliveTime, // 从嵌套结构中提取 (Extract from nested structure)
                    // 更多 req.body 中的字段可以按需映射到 Device schema 的顶层字段
                    // (More fields from req.body can be mapped to top-level fields of the Device schema as needed)
                },
                $setOnInsert: { deviceSN: DeviceSN } // 确保在创建时 deviceSN 被设置 (Ensure deviceSN is set on creation)
            },
            { upsert: true, new: true, setDefaultsOnInsert: true } // 选项：更新或插入，返回更新后的文档，应用默认值 (Options: update or insert, return updated document, apply defaults)
        );

        if (!updatedDevice) {
            // 理论上 upsert:true 会创建，所以这里不太可能除非有并发问题或特殊情况
            // (Theoretically, upsert:true will create, so this is unlikely unless there are concurrency issues or special circumstances)
            console.error(`设备 SN: ${DeviceSN} 在工作参数上传时未找到也未能创建。 (Device SN: ${DeviceSN} not found and could not be created during work parameter upload.)`);
            return res.status(404).json({ Success: 0, Message: '设备未找到且无法创建 (Device not found and could not be created)' });
        }
        
        console.log(`设备 SN: ${DeviceSN} 的工作参数已成功上传并存储/更新。设备名称: ${updatedDevice.deviceName}, 固件版本: ${updatedDevice.firmwareVersion}`);
        // (Device SN: ${DeviceSN}'s work parameters successfully uploaded and stored/updated. Device name: ${updatedDevice.deviceName}, Firmware version: ${updatedDevice.firmwareVersion})
        
        res.json({
            "Success": 1 // 1 表示操作成功 (1 means operation successful)
        });

    } catch (error) {
        console.error(`处理设备 SN: ${DeviceSN} 的工作参数上传时发生错误 (Error processing work parameter upload for device SN: ${DeviceSN}):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误处理参数上传 (Server internal error processing parameter upload)' });
    }
});

// 新增：处理设备上报远程命令执行状态的请求
// New: Handle device reporting of remote command execution status
// @route POST /Device/UpdateCommandStatus
// @desc 设备上报远程命令的执行状态更新 (Device reports updates to the execution status of a remote command)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UpdateCommandStatus', async (req, res) => {
    const { SN, CommandID, Status, ErrorMessage } = req.body;

    // 1. 校验必填字段
    // 1. Validate required fields
    if (!SN || !CommandID || !Status) {
        console.log(`更新命令状态请求失败: 缺少必填字段。SN: ${SN}, CommandID: ${CommandID}, Status: ${Status}`);
        // (Update command status request failed: Missing required fields. SN: ${SN}, CommandID: ${CommandID}, Status: ${Status})
        return res.status(400).json({ Success: 0, Message: 'SN, CommandID, 和 Status 是必填项 (SN, CommandID, and Status are required)' });
    }

    // 2. 校验 Status 是否为有效值
    // 2. Validate if Status is a valid value
    const allowedStatuses = ['Pending', 'Sent', 'Acknowledged', 'Failed', 'Processing'];
    if (!allowedStatuses.includes(Status)) {
        console.log(`更新命令状态请求失败: 无效的状态值 '${Status}'。设备 SN: ${SN}, CommandID: ${CommandID}`);
        // (Update command status request failed: Invalid status value '${Status}'. Device SN: ${SN}, CommandID: ${CommandID})
        return res.status(400).json({ Success: 0, Message: `无效的状态值。允许的状态有: ${allowedStatuses.join(', ')} (Invalid status value. Allowed statuses are: ${allowedStatuses.join(', ')})` });
    }

    console.log(`接收到命令状态更新请求: 设备 SN: ${SN}, CommandID: ${CommandID}, Status: ${Status}` + (ErrorMessage ? `, ErrorMessage: ${ErrorMessage}` : ''));
    // (Received command status update request: Device SN: ${SN}, CommandID: ${CommandID}, Status: ${Status}` + (ErrorMessage ? `, ErrorMessage: ${ErrorMessage}` : ''))

    try {
        // 3. 查找命令
        // 3. Find the command
        const command = await RemoteCommandQueue.findOne({ _id: CommandID, deviceSN: SN });

        // 4. 如果命令未找到
        // 4. If command not found
        if (!command) {
            console.log(`更新命令状态失败: 未找到匹配的命令。设备 SN: ${SN}, CommandID: ${CommandID}`);
            // (Update command status failed: No matching command found. Device SN: ${SN}, CommandID: ${CommandID})
            return res.status(404).json({ Success: 0, Message: '未找到指定的命令 (Specified command not found)' });
        }

        // 5. 更新命令状态
        // 5. Update command status
        command.status = Status;
        command.lastUpdatedAt = new Date(); // 新增：记录状态更新时间 (New: Record status update time)

        // 6. 如果状态为 'Failed' 且提供了 ErrorMessage，则更新 errorMessage
        // 6. If Status is 'Failed' and ErrorMessage is provided, update errorMessage
        if (Status === 'Failed' && ErrorMessage) {
            command.errorMessage = ErrorMessage;
        } else if (Status !== 'Failed') {
            // 如果状态不是 'Failed'，可以考虑清除旧的错误信息 (或者根据需求保留)
            // If status is not 'Failed', consider clearing old error messages (or retain based on requirements)
            command.errorMessage = undefined; 
        }
        
        // 7. 保存更新后的命令
        // 7. Save the updated command
        await command.save();

        // 8. 记录成功更新
        // 8. Log successful update
        console.log(`命令 ${CommandID} 为设备 ${SN} 状态已成功更新为 ${Status}。`);
        // (Command ${CommandID} for device ${SN} status successfully updated to ${Status}.)

        // 9. 返回成功响应
        // 9. Return success response
        res.json({ Success: 1, Message: '命令状态更新成功 (Command status updated successfully)' });

    } catch (error) {
        // 10. 处理潜在错误
        // 10. Handle potential errors
        console.error(`更新命令 ${CommandID} (设备 SN: ${SN}) 状态时发生服务器错误:`, error);
        // (Server error while updating status for command ${CommandID} (Device SN: ${SN}):`, error)
        res.status(500).json({ Success: 0, Message: '服务器内部错误更新命令状态 (Server internal error updating command status)' });
    }
});


// 导出路由模块
// Export the router module
module.exports = router;
