<template>
  <div class="device-management-view">
    <h2>设备管理</h2>
    <!-- 设备管理页面标题 -->
    <!-- Device Management Page Title -->

    <el-table :data="deviceList" style="width: 100%" border stripe>
      <!-- Element Plus 表格，用于显示设备列表 -->
      <!-- Element Plus table for displaying the device list -->

      <el-table-column prop="sn" label="设备SN" width="180" />
      <!-- 表格列：设备SN -->
      <!-- Table Column: Device SN -->

      <el-table-column prop="name" label="设备名称" width="180" />
      <!-- 表格列：设备名称 -->
      <!-- Table Column: Device Name -->

      <el-table-column prop="ipAddress" label="IP地址" width="150" />
      <!-- 表格列：IP地址 -->
      <!-- Table Column: IP Address -->

      <el-table-column prop="onlineStatus" label="在线状态" width="100">
        <!-- 表格列：在线状态，使用自定义模板显示标签 -->
        <!-- Table Column: Online Status, uses custom template to display a tag -->
        <template #default="scope">
          <el-tag :type="scope.row.onlineStatus ? 'success' : 'danger'">
            {{ scope.row.onlineStatus ? '在线' : '离线' }}
            <!-- 根据在线状态显示不同颜色和文本的标签 -->
            <!-- Tag with different color and text based on online status -->
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="lastKeepalive" label="最后心跳时间" width="200" />
      <!-- 表格列：最后心跳时间 -->
      <!-- Table Column: Last Keepalive Time -->

      <el-table-column label="操作" width="280">
        <!-- 表格列：操作按钮，使用自定义模板 -->
        <!-- Table Column: Action Buttons, uses custom template -->
        <template #default="scope">
          <el-button size="small" @click="handleViewDetails(scope.row)">详情</el-button>
          <!-- 详情按钮 -->
          <!-- Details Button -->
          <el-button size="small" type="primary" @click="handleConfigure(scope.row)">参数配置</el-button>
          <!-- 参数配置按钮 -->
          <!-- Configure Parameters Button -->
          <el-button size="small" type="warning" @click="handleRemoteOperation(scope.row)">远程操作</el-button>
          <!-- 远程操作按钮 -->
          <!-- Remote Operations Button -->
        </template>
      </el-table-column>
    </el-table>

    <!-- TODO: 详情弹窗、参数配置弹窗、远程操作弹窗 -->
    <!-- Placeholder for future dialogs for details, configuration, and remote operations -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
// 导入Vue组合式API 和 Element Plus 组件 (Import Vue Composition API and Element Plus components)
// Element Plus 组件已在 main.ts 全局注册，此处按需导入仅为示例或在特定情况下使用 (Element Plus components are globally registered in main.ts, importing here is for example or specific cases)
// import { ElTable, ElTableColumn, ElButton, ElTag } from 'element-plus';

// 定义设备数据接口
// Define the interface for device data
interface Device {
  id: string; // 唯一标识，可以是SN (Unique identifier, can be SN)
  sn: string; // 设备序列号 (Device serial number)
  name: string; // 设备名称 (Device name)
  ipAddress: string; // IP地址 (IP address)
  onlineStatus: boolean; // 在线状态 (Online status)
  lastKeepalive: string; // 最后心跳时间 (字符串格式，方便显示) (Last keepalive time - string format for easy display)
}

export default defineComponent({
  name: 'DeviceManagementView', // 组件名称 (Component name)
  components: {
    // 如果选择按需导入Element Plus组件，请在此处注册它们
    // If you choose to import Element Plus components on demand, register them here:
    // ElTable,
    // ElTableColumn,
    // ElButton,
    // ElTag,
  },
  setup() {
    // Vue 3 Composition API setup function

    // 模拟设备列表数据 (Simulate device list data)
    const deviceList = ref<Device[]>([
      { id: 'FC-8200H12345678', sn: 'FC-8200H12345678', name: '一号门禁机', ipAddress: '192.168.1.101', onlineStatus: true, lastKeepalive: new Date().toLocaleString() },
      { id: 'FC-8200HABCDEFGH', sn: 'FC-8200HABCDEFGH', name: '二号人脸桩', ipAddress: '192.168.1.102', onlineStatus: false, lastKeepalive: new Date(Date.now() - 3600 * 1000 * 5).toLocaleString() }, // 5小时前 (5 hours ago)
      { id: 'FC-8300T98765432', sn: 'FC-8300T98765432', name: '办公区闸机', ipAddress: '192.168.1.103', onlineStatus: true, lastKeepalive: new Date(Date.now() - 60000 * 2).toLocaleString() }, // 2分钟前 (2 minutes ago)
    ]);

    // TODO: 替换为从API获取数据的逻辑
    // Placeholder for fetching data from API in the future
    // onMounted(async () => {
    //   try {
    //     // deviceList.value = await fetchDevices(); // 假设 fetchDevices 在 api.ts 中定义并返回 Device[] (Assuming fetchDevices is defined in api.ts and returns Device[])
    //   } catch (error) {
    //     console.error("获取设备列表失败: (Failed to fetch device list:)", error);
    //   }
    // });

    // 处理查看详情操作
    // Handle view details operation
    const handleViewDetails = (device: Device) => {
      console.log('查看设备详情 (View Device Details):', device.sn);
      // TODO: 实现显示设备详细信息的逻辑 (例如，通过弹窗或跳转到详情页)
      // Implement logic to show device details (e.g., via dialog or navigation to a details page)
    };

    // 处理参数配置操作
    // Handle configure parameters operation
    const handleConfigure = (device: Device) => {
      console.log('配置设备参数 (Configure Device Parameters):', device.sn);
      // TODO: 实现参数配置的逻辑 (例如，通过弹窗显示可配置参数)
      // Implement logic for parameter configuration (e.g., show configurable parameters in a dialog)
    };

    // 处理远程操作
    // Handle remote operation
    const handleRemoteOperation = (device: Device) => {
      console.log('执行远程操作 (Execute Remote Operation):', device.sn);
      // TODO: 实现远程操作的逻辑 (例如，显示可用远程命令列表)
      // Implement logic for remote operations (e.g., show a list of available remote commands)
    };

    // 返回组件模板所需的数据和方法
    // Return data and methods needed by the component template
    return {
      deviceList,
      handleViewDetails,
      handleConfigure,
      handleRemoteOperation,
    };
  },
});
</script>

<style scoped>
.device-management-view {
  padding: 20px; /* 视图内边距 (Padding for the view) */
}
/* 可以添加更多自定义样式 */
/* More custom styles can be added here */
</style>
