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
