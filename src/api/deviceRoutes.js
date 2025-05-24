// 导入 Express 框架
// Import the Express framework
const express = require('express');
// 创建路由实例
// Create a router instance
const router = express.Router();

// 导入 multer 用于处理 multipart/form-data
// Import multer for handling multipart/form-data
const multer = require('multer');

// 为 /Device/RegisterIdentifyTicketResult 配置 multer
// Configure multer for /Device/RegisterIdentifyTicketResult
const uploadResultJsonAndPhoto = multer().fields([{ name: 'ResultJson', maxCount: 1 }, { name: 'Photo', maxCount: 1 }]);

// 为 /Device/UploadSnapshoot 配置 multer
// Configure multer for /Device/UploadSnapshoot
const uploadSnapshoot = multer().fields([{ name: 'SN', maxCount: 1 }, { name: 'Photo', maxCount: 1 }]);

// 处理设备心跳包请求
// Handle device keepalive requests
// @route POST /Device/Keepalive
// @desc 设备发送心跳以保持连接并检查指令 (Device sends keepalive to maintain connection and check for commands)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/Keepalive', (req, res) => {
    // 从请求体中获取设备数据
    // Get device data from the request body
    const { SN, RelayStatus, KeepOpenStatus, DoorSensorStatus, LockDoorStatus, AlarmStatus } = req.body;
    
    // 打印接收到的设备SN和状态 (用于当前阶段的调试)
    // Print received device SN and status (for debugging in the current phase)
    console.log(`接收到心跳来自设备 SN (Received keepalive from device SN): ${SN}`);
    console.log(`设备状态 (Device status): RelayStatus=${RelayStatus}, KeepOpenStatus=${KeepOpenStatus}, DoorSensorStatus=${DoorSensorStatus}, LockDoorStatus=${LockDoorStatus}, AlarmStatus='${AlarmStatus}'`);

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 更新数据库中的设备在线状态和最后心跳时间 (DeviceStatus 集合) (Update device online status and last keepalive time in the database (DeviceStatus collection))
    // 3. 查询 RemoteCommandQueue 集合中是否有针对此SN的待处理指令 (Query the RemoteCommandQueue collection for pending commands for this SN)
    // 4. 根据查询结果动态设置 AddPeople, DeletePeople, SyncParameter, Remote, UploadWorkParameter 的值 (Dynamically set the values of AddPeople, DeletePeople, SyncParameter, Remote, UploadWorkParameter based on query results)

    // 返回标准响应
    // Return standard response
    res.json({
        "Success": 1, // 1:成功 (1: Success)
        "AddPeople": 0, // >0--表示有需要添加人员到设备 (>0 -- means there are people to add to the device)
        "DeletePeople": 0, // >0--表示需要从设备删除人员 (>0 -- means people need to be deleted from the device)
        "SyncParameter": 0, // 1--表示有参数需要设置到设备 (1 -- means parameters need to be set to the device)
        "Remote": 0, // 1--表示有远程操作需要处理 (1 -- means remote operations need to be processed)
        "UploadWorkParameter": 0 // 1--表示要求设备上传设备工作参数 (1 -- means the device is required to upload work parameters)
    });
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
// @desc 设备在收到心跳包中 Remote=1 指令后，请求此接口获取具体的远程操作命令 (After receiving Remote=1 in heartbeat, device requests this interface for specific remote commands)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/RemoteCommand', (req, res) => {
    // 从请求体中获取设备SN
    // Get device SN from the request body
    const { SN } = req.body;

    // 打印接收到的设备SN (用于当前阶段的调试)
    // Print received device SN (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 请求远程操作指令。 (Device SN: ${SN} requests remote operation command.)`);

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 查询 RemoteCommandQueue 集合中是否有针对此SN的待执行指令 (Query RemoteCommandQueue for pending commands for this SN)
    // 3. 如果有指令，则构建相应的指令JSON对象返回给设备 (If commands exist, construct and return the command JSON to the device)
    // 4. 更新指令在队列中的状态 (例如，从未发送变为已发送) (Update command status in the queue, e.g., from pending to sent)

    // 默认返回无待处理指令的响应
    // Default response indicating no pending commands
    res.json({
        "Success": 1, // 1 表示成功 (1 means success)
        "Message": "当前无待处理的远程操作指令" // 提示信息，可选 (Informational message, optional)
        // "Restart": 0, // 远程重启: 0:不重启, 1:重启 (示例：无重启指令) (Remote restart: 0: no restart, 1: restart (Example: no restart command))
        // "Opendoor": 0 // 远程开门: 0:不处理 (示例：无开门指令) (Remote open door: 0: do not process (Example: no open door command))
    });
});

// 处理设备下载工作参数的请求
// @route POST /Device/DownloadWorkSetting
// @desc 设备在收到心跳包中 SyncParameter=1 指令后，请求此接口下载最新配置 (Device requests this interface to download the latest configuration after receiving SyncParameter=1 command in the heartbeat package)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/DownloadWorkSetting', (req, res) => {
    // 从请求体中获取设备SN
    // Get device SN from the request body
    const { SN } = req.body;

    // 打印接收到的设备SN (用于当前阶段的调试)
    // Print received device SN (for debugging in the current phase)
    console.log(`设备 SN: ${SN} 请求下载工作参数。 (Device SN: ${SN} requests download of work parameters.)`);

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 从数据库 (Device 集合) 查询该设备的最新工作参数 (Query the latest work parameters for this device from the database (Device collection))
    // 3. 构建完整的参数对象并返回 (Construct the complete parameter object and return it)

    // 返回包含占位符参数的标准响应
    // Return standard response with placeholder parameters
    // 注意：这里的参数是示例性的，真实实现需要从数据库动态获取
    // Note: The parameters here are exemplary; actual implementation requires dynamic retrieval from the database.
    res.json({
        "Success": 1, // 1 表示操作成功 (1 means operation successful)
        "DeviceSN": SN, // 将请求的SN回显 (Echo back the requested SN)
        "FireAlarm": 0, // 消防报警: 0 关闭, 1 开启 (Fire alarm: 0 Off, 1 On - example)
        "DoorLongOpenAlarm": 0, // 开门超时报警: 0 关闭, 1 开启 (Door open timeout alarm: 0 Off, 1 On - example)
        "Language": 1, // 语言: 1-中文 (Language: 1-Chinese - example)
        "HTTPClient_ServerAddr": "http://your.platform.ip:port", // 平台服务器地址 (Platform server address - example)
        "HTTPClient_KeepaliveTime": 30, // 心跳间隔, 单位秒 (Keepalive interval, in seconds - example)
        "RelayTime": 5, // 继电器动作时间, 单位秒 (Relay action time, in seconds - example)
        "RebootDay": 0, // 自动重启日: 0-每天, 1-周一...7-周日 (Auto reboot day: 0-Everyday, 1-Monday...7-Sunday - example)
        "RebootHour": 3 // 自动重启小时 (Auto reboot hour - example)
        // 根据需要可添加更多参数字段... (More parameter fields can be added as needed...)
    });
});

// 处理设备上传工作参数的请求
// @route POST /Device/UploadWorkSetting
// @desc 设备上传其当前的工作参数设置 (Device uploads its current work parameter settings)
// @access Public (实际项目中需要身份验证 - Authentication will be needed in a real project)
router.post('/UploadWorkSetting', (req, res) => {
    // 从请求体中获取设备SN和工作参数
    // Get device SN and work parameters from the request body
    const { DeviceSN } = req.body; // DeviceSN 是顶级字段之一 (DeviceSN is one of the top-level fields)
    // const workSettings = req.body; // 完整的参数对象 (The complete parameter object)

    // 打印接收到的设备SN (用于当前阶段的调试)
    // Print received device SN (for debugging in the current phase)
    console.log(`接收到来自设备 SN: ${DeviceSN} 的工作参数上传请求。 (Received work parameter upload request from device SN: ${DeviceSN}.)`);
    // console.log("设备参数详情 (Device parameter details):", JSON.stringify(workSettings, null, 2)); // 可选择性打印完整参数，注意数据量 (Optionally print full parameters, be mindful of data volume)

    // TODO: 在后续步骤中，这里将包含:
    // In subsequent steps, this will include:
    // 1. 验证设备SN的合法性 (Validate the legitimacy of the device SN)
    // 2. 解析并验证接收到的参数结构是否符合预期 (Parse and validate if the received parameter structure meets expectations)
    // 3. 将这些参数存储或更新到数据库中对应的设备文档 (Device 集合) (Store or update these parameters in the corresponding device document in the database (Device collection))

    // 返回标准成功响应
    // Return standard success response
    res.json({
        "Success": 1 // 1 表示操作成功 (1 means operation successful)
    });
});

// 导出路由模块
// Export the router module
module.exports = router;
