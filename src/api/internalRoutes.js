// src/api/internalRoutes.js
// 内部管理接口，不暴露给设备端
// (Internal management interface, not exposed to devices)

const express = require('express');
const router = express.Router();
const RemoteCommandQueue = require('../models/remoteCommandQueue'); // 引入RemoteCommandQueue模型 (Import RemoteCommandQueue model)

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

module.exports = router;
