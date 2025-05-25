// src/api/internalRoutes.js
// 内部管理接口，不暴露给设备端
// (Internal management interface, not exposed to devices)

const express = require('express');
const router = express.Router();
const RemoteCommandQueue = require('../models/remoteCommandQueue'); // 引入RemoteCommandQueue模型 (Import RemoteCommandQueue model)
const Device = require('../models/device'); // 引入Device模型 (Import Device model)
const DeviceStatus = require('../models/deviceStatus'); // 引入DeviceStatus模型 (Import DeviceStatus model)
const People = require('../models/people'); // 引入People模型 (Import People model)

// 手动向指定设备命令队列添加新命令
// (Manually add a new command to the specified device's command queue)
// @route POST /internal/enqueue-command
// @desc 用于测试或后台管理系统手动添加远程命令到队列
// (Used for testing or by backend management system to manually add remote commands to the queue)
// @access Restricted (应有权限控制，当前为内部测试)
// (Restricted - should have permission control, currently for internal testing)
router.post('/enqueue-command', async (req, res) => {
    const { deviceSN, commandType, commandPayload, priority } = req.body;

    // 校验 deviceSN 和 commandType 是否存在
    // (Validate if deviceSN and commandType exist)
    if (!deviceSN || !commandType) {
        return res.status(400).json({ Success: 0, Message: 'deviceSN 和 commandType 不能为空 (deviceSN and commandType cannot be empty)' });
    }

    try {
        // 创建新的远程命令实例
        // (Create new remote command instance)
        const newCommand = new RemoteCommandQueue({
            deviceSN,
            commandType,
            commandPayload: commandPayload || {}, // 如果没有提供payload，默认为空对象 (If no payload provided, default to empty object)
            priority: priority || 0, // 如果没有提供优先级，默认为0 (If no priority provided, default to 0)
            // status, maxRetries, retryCount等将使用Schema定义的默认值 ('Pending', 3, 0)
            // (status, maxRetries, retryCount, etc., will use default values defined in Schema ('Pending', 3, 0))
        });

        // 保存到数据库
        // (Save to database)
        await newCommand.save();
        
        console.log(`新命令已成功添加到队列: 设备 SN ${deviceSN}, 命令类型 ${commandType}, 优先级 ${newCommand.priority}`);
        // (New command successfully added to queue: Device SN ${deviceSN}, Command Type ${commandType}, Priority ${newCommand.priority})
        
        // 返回成功响应和创建的命令对象
        // (Return success response and the created command object)
        res.status(201).json({ 
            Success: 1, 
            Message: '命令已成功添加到队列 (Command enqueued successfully)', 
            command: newCommand 
        });

    } catch (error) {
        console.error(`向命令队列添加命令时发生错误 (Error enqueuing command for device SN ${deviceSN}):`, error);
        // (Error enqueuing command for device SN ${deviceSN}:)
        res.status(500).json({ Success: 0, Message: '服务器内部错误，无法添加命令到队列 (Server internal error, failed to enqueue command)' });
    }
});

// --- People Management CRUD ---

// GET /internal/people - 获取所有人员信息
// (Get all people information)
router.get('/people', async (req, res) => {
    try {
        // TODO: Implement pagination for large datasets (e.g., using req.query.page and req.query.limit)
        // (TODO: 为大型数据集实现分页 (例如使用 req.query.page 和 req.query.limit))
        const people = await People.find().lean();
        res.json({ Success: 1, people });
    } catch (error) {
        console.error('获取所有人员信息时发生错误 (Error fetching all people):', error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// GET /internal/people/:id - 获取单个人员信息
// (Get single person information by _id)
router.get('/people/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const person = await People.findById(id).lean();
        if (!person) {
            return res.status(404).json({ Success: 0, Message: '未找到人员 (Person not found)' });
        }
        res.json({ Success: 1, person });
    } catch (error) {
        console.error(`获取人员 ${id} 信息时发生错误 (Error fetching person ${id}):`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ Success: 0, Message: '无效的人员ID格式 (Invalid person ID format)' });
        }
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// POST /internal/people - 创建新的人员
// (Create a new person)
router.post('/people', async (req, res) => {
    try {
        // 从请求体中提取所有可能的字段 (Extract all possible fields from request body)
        // Mongoose schema 会处理哪些字段是必需的或有默认值 (Mongoose schema will handle which fields are required or have defaults)
        const newPerson = new People(req.body);
        const savedPerson = await newPerson.save();
        console.log(`新人员已创建: UserID ${savedPerson.userID}, Name ${savedPerson.name}`);
        res.status(201).json({ Success: 1, Message: '人员创建成功 (Person created successfully)', person: savedPerson });
    } catch (error) {
        console.error('创建人员时发生错误 (Error creating person):', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ Success: 0, Message: '验证错误 (Validation error)', Details: error.errors });
        }
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// PUT /internal/people/:id - 更新人员信息
// (Update person information by _id)
router.put('/people/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // 防止意外更新或清空 deviceSNs (如果它是通过其他逻辑管理的)
    // (Prevent accidental update or clearing of deviceSNs if managed by other logic)
    // 如果需要完全替换 deviceSNs，客户端应明确提供新的完整数组
    // (If full replacement of deviceSNs is needed, client should explicitly provide the new full array)
    // delete updates.deviceSNs; // 根据业务逻辑决定是否保留此行 (Decide whether to keep this line based on business logic)

    // 同样，userID 通常不应被更改，因为它可能是关键标识符 (Similarly, userID usually shouldn't be changed as it might be a key identifier)
    if (updates.userID) {
        delete updates.userID; 
    }
    if (updates._id) { // 防止更新 _id (Prevent updating _id)
        delete updates._id;
    }


    try {
        const updatedPerson = await People.findByIdAndUpdate(
            id,
            { $set: updates }, // 使用 $set 以避免覆盖整个文档 (Use $set to avoid overwriting the entire document)
            { new: true, runValidators: true } // 返回更新后的文档并运行校验器 (Return updated document and run validators)
        ).lean();

        if (!updatedPerson) {
            return res.status(404).json({ Success: 0, Message: '未找到人员 (Person not found)' });
        }
        console.log(`人员信息已更新: ID ${id}, Name ${updatedPerson.name}`);
        res.json({ Success: 1, Message: '人员信息更新成功 (Person updated successfully)', person: updatedPerson });
    } catch (error) {
        console.error(`更新人员 ${id} 信息时发生错误 (Error updating person ${id}):`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ Success: 0, Message: '无效的人员ID格式 (Invalid person ID format)' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ Success: 0, Message: '验证错误 (Validation error)', Details: error.errors });
        }
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// DELETE /internal/people/:id - 删除人员
// (Delete person by _id)
router.delete('/people/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedPerson = await People.findByIdAndDelete(id);
        if (!deletedPerson) {
            return res.status(404).json({ Success: 0, Message: '未找到人员 (Person not found)' });
        }
        console.log(`人员已删除: ID ${id}, UserID ${deletedPerson.userID}, Name ${deletedPerson.name}`);
        res.json({ Success: 1, Message: '人员删除成功 (Person deleted successfully)' });
        // 或者使用 204 No Content (Alternatively, use 204 No Content):
        // res.status(204).send(); 
    } catch (error) {
        console.error(`删除人员 ${id} 时发生错误 (Error deleting person ${id}):`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ Success: 0, Message: '无效的人员ID格式 (Invalid person ID format)' });
        }
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// --- Device Management CRUD ---

// GET /internal/devices - 获取所有设备及其状态
// (Get all devices and their statuses)
router.get('/devices', async (req, res) => {
    try {
        const devices = await Device.find().lean(); // 使用 .lean() 获取普通JS对象 (Use .lean() for plain JS objects)
        
        const devicesWithStatus = await Promise.all(devices.map(async (device) => {
            const status = await DeviceStatus.findOne({ deviceSN: device.deviceSN }).lean();
            return {
                ...device,
                onlineStatus: status?.onlineStatus || false,
                lastKeepaliveAt: status?.lastKeepaliveAt || null,
                statusIpAddress: status?.ipAddress || null, // IP from DeviceStatus
                // 其他状态字段可以按需添加 (Other status fields can be added as needed)
                // (e.g., RelayStatus, DoorSensorStatus, etc. from status object)
            };
        }));

        res.json({ Success: 1, devices: devicesWithStatus });
    } catch (error) {
        console.error('获取所有设备及其状态时发生错误 (Error fetching all devices with status):', error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// GET /internal/devices/:deviceSN - 获取单个设备及其状态和工作参数
// (Get a single device, its status, and work settings)
router.get('/devices/:deviceSN', async (req, res) => {
    const { deviceSN } = req.params;
    try {
        const device = await Device.findOne({ deviceSN }).lean();
        if (!device) {
            return res.status(404).json({ Success: 0, Message: '未找到设备 (Device not found)' });
        }

        const status = await DeviceStatus.findOne({ deviceSN }).lean();
        
        const deviceDetails = {
            ...device,
            onlineStatus: status?.onlineStatus || false,
            lastKeepaliveAt: status?.lastKeepaliveAt || null,
            statusIpAddress: status?.ipAddress || null,
            // workSettings 已经包含在 device 对象中，因为它是 Device model 的一部分
            // (workSettings is already included in the device object as it's part of the Device model)
        };
        
        res.json({ Success: 1, device: deviceDetails });
    } catch (error) {
        console.error(`获取设备 ${deviceSN} 详情时发生错误 (Error fetching device ${deviceSN} details):`, error);
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// PUT /internal/devices/:deviceSN - 更新设备基本信息
// (Update basic device information)
router.put('/devices/:deviceSN', async (req, res) => {
    const { deviceSN } = req.params;
    const updates = req.body;

    // 定义允许更新的字段 (Define allowed updatable fields)
    const allowedUpdates = [
        'deviceName', 'firmwareVersion', 'macAddress', 
        'httpClientServerAddr', 'httpClientKeepaliveTime', 'mqttServerAddr',
        'manufacturer', 'productionDate', 'ipAddress', 'subnetMask', 'gatewayAddress', 'dnsServer'
        // 注意: deviceSN 和 workSettings 不应通过此接口更新
        // (Note: deviceSN and workSettings should not be updated via this endpoint)
    ];

    const updateData = {};
    for (const key in updates) {
        if (allowedUpdates.includes(key)) {
            updateData[key] = updates[key];
        }
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ Success: 0, Message: '请求体中无可更新的有效字段 (No valid updatable fields in request body)' });
    }
    // 防止意外更新 deviceSN
    // (Prevent accidental update of deviceSN)
    if (updateData.deviceSN) {
        delete updateData.deviceSN;
    }

    try {
        const updatedDevice = await Device.findOneAndUpdate(
            { deviceSN },
            { $set: updateData },
            { new: true, runValidators: true } // 返回更新后的文档并运行校验器 (Return updated document and run validators)
        ).lean();

        if (!updatedDevice) {
            return res.status(404).json({ Success: 0, Message: '未找到设备 (Device not found)' });
        }
        
        // 为了保持一致性，也返回状态信息 (For consistency, also return status info)
        const status = await DeviceStatus.findOne({ deviceSN: updatedDevice.deviceSN }).lean();
        const deviceDetails = {
            ...updatedDevice,
            onlineStatus: status?.onlineStatus || false,
            lastKeepaliveAt: status?.lastKeepaliveAt || null,
            statusIpAddress: status?.ipAddress || null,
        };

        res.json({ Success: 1, Message: '设备信息更新成功 (Device information updated successfully)', device: deviceDetails });
    } catch (error) {
        console.error(`更新设备 ${deviceSN} 信息时发生错误 (Error updating device ${deviceSN} information):`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ Success: 0, Message: '验证错误 (Validation error)', Details: error.errors });
        }
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// PUT /internal/devices/:deviceSN/work-settings - 更新设备的工作参数
// (Update device's work settings)
router.put('/devices/:deviceSN/work-settings', async (req, res) => {
    const { deviceSN } = req.params;
    const newWorkSettings = req.body; // 整个请求体应为新的 workSettings 对象 (The entire request body should be the new workSettings object)

    if (typeof newWorkSettings !== 'object' || newWorkSettings === null) {
        return res.status(400).json({ Success: 0, Message: '请求体必须是一个有效的JSON对象作为工作参数 (Request body must be a valid JSON object for work settings)' });
    }
    
    // 从安全角度考虑，可以对 newWorkSettings 进行一些基本验证或清理
    // (For security, some basic validation or sanitization of newWorkSettings could be performed)
    // 例如，检查是否包含不允许的字段，或字段类型是否正确
    // (For example, check for disallowed fields or correct field types)
    // 但由于它是 Mixed 类型，这里我们主要依赖于调用者提供正确的结构
    // (But since it's a Mixed type, we primarily rely on the caller to provide the correct structure)

    try {
        const device = await Device.findOne({ deviceSN });

        if (!device) {
            return res.status(404).json({ Success: 0, Message: '未找到设备 (Device not found)' });
        }

        device.workSettings = newWorkSettings; // 直接替换 (Direct replacement)
        device.lastUpdatedAt = new Date(); // 记录更新时间 (Record update time)
        const updatedDevice = await device.save();
        
        // 为了保持一致性，也返回状态信息 (For consistency, also return status info)
        const status = await DeviceStatus.findOne({ deviceSN: updatedDevice.deviceSN }).lean();
        const deviceDetails = {
            _id: updatedDevice._id, // 确保返回关键字段 (Ensure key fields are returned)
            deviceSN: updatedDevice.deviceSN,
            deviceName: updatedDevice.deviceName,
            workSettings: updatedDevice.workSettings,
            onlineStatus: status?.onlineStatus || false,
            lastKeepaliveAt: status?.lastKeepaliveAt || null,
            statusIpAddress: status?.ipAddress || null,
            lastUpdatedAt: updatedDevice.lastUpdatedAt
        };

        res.json({ Success: 1, Message: '设备工作参数更新成功 (Device work settings updated successfully)', device: deviceDetails });
    } catch (error) {
        console.error(`更新设备 ${deviceSN} 工作参数时发生错误 (Error updating device ${deviceSN} work settings):`, error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ Success: 0, Message: '验证错误 (Validation error)', Details: error.errors });
        }
        res.status(500).json({ Success: 0, Message: '服务器内部错误 (Server internal error)' });
    }
});

// 手动重试特定命令
// (Manually retry a specific command)
// @route POST /internal/retry-command/:commandId
// @desc 重新计划一个命令的执行，通常用于已失败或卡住的命令
// (Reschedule a command for execution, typically for commands that have failed or are stuck)
// @access Restricted (应有权限控制)
// (Restricted - should have permission control)
router.post('/retry-command/:commandId', async (req, res) => {
    const { commandId } = req.params;

    if (!commandId) { // 理论上 Express 路由参数不会为空，但作为额外检查 (Theoretically, Express route parameters won't be empty, but as an extra check)
        return res.status(400).json({ Success: 0, Message: 'Command ID 不能为空 (Command ID cannot be empty)' });
    }

    try {
        const command = await RemoteCommandQueue.findById(commandId);

        if (!command) {
            console.log(`手动重试命令失败: 未找到 Command ID ${commandId}。 (Manual retry command failed: Command ID ${commandId} not found.)`);
            return res.status(404).json({ Success: 0, Message: '未找到指定的命令 (Command not found)' });
        }

        // 更新命令状态以进行重试
        // (Update command status for retry)
        command.status = 'Pending';
        command.retryCount = 0;
        command.errorMessage = undefined; // 清除之前的错误信息 (Clear previous error message)
        command.lastUpdatedAt = new Date(); // 记录本次重置操作的时间 (Record the time of this reset operation)
        // lastAttemptAt 应该在下次实际尝试发送时更新 (lastAttemptAt should be updated on the next actual send attempt)

        const updatedCommand = await command.save();

        console.log(`命令 ${commandId} 已被手动重置以进行重试。设备SN: ${updatedCommand.deviceSN}, 类型: ${updatedCommand.commandType}`);
        // (Command ${commandId} has been manually reset for retry. Device SN: ${updatedCommand.deviceSN}, Type: ${updatedCommand.commandType})
        
        res.json({ 
            Success: 1, 
            Message: '命令已成功重置并计划重试 (Command successfully reset and scheduled for retry)', 
            command: updatedCommand 
        });

    } catch (error) {
        console.error(`手动重试命令 ${commandId} 时发生错误:`, error);
        // (Error manually retrying command ${commandId}:)
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            // 如果 commandId 格式无效 (If commandId format is invalid)
             return res.status(400).json({ Success: 0, Message: '提供的 Command ID 格式无效 (Invalid Command ID format provided)' });
        }
        res.status(500).json({ Success: 0, Message: '服务器内部错误，无法重试命令 (Server internal error, failed to retry command)' });
    }
});

module.exports = router;
