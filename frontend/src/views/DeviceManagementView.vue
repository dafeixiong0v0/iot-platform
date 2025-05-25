<template>
  <div class="device-management-view">
    <h2>设备管理</h2>

    <el-table :data="deviceList" style="width: 100%" border stripe v-loading="loading">
      <el-table-column prop="deviceSN" label="设备SN" width="180" />
      <el-table-column prop="deviceName" label="设备名称" width="180" />
      <el-table-column prop="ipAddress" label="IP地址 (设备上报)" width="150" />
      <el-table-column prop="statusIpAddress" label="IP地址 (心跳来源)" width="150" />
      <el-table-column prop="onlineStatus" label="在线状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.onlineStatus ? 'success' : 'danger'">
            {{ scope.row.onlineStatus ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastKeepaliveAt" label="最后心跳时间" width="200">
         <template #default="scope">
          {{ formatDateTime(scope.row.lastKeepaliveAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="firmwareVersion" label="固件版本" width="120" />

      <el-table-column label="操作" width="280" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleViewDetails(scope.row)">详情</el-button>
          <el-button size="small" type="primary" @click="handleConfigure(scope.row)">参数配置</el-button>
          <el-button size="small" type="warning" @click="handleRemoteOperation(scope.row)">远程操作</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetailsDialog" title="设备详情" width="60%">
      <div v-if="selectedDeviceDetails">
        <pre>{{ JSON.stringify(selectedDeviceDetails, null, 2) }}</pre>
      </div>
      <div v-else>加载中...</div>
      <template #footer>
        <el-button @click="showDetailsDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 参数配置弹窗 -->
    <el-dialog v-model="showConfigureDialog" title="参数配置" width="70%">
      <div v-if="currentWorkSettings">
        <p>设备SN: {{ selectedDeviceForConfig?.deviceSN }}</p>
        <el-input
          type="textarea"
          :rows="15"
          placeholder="请输入JSON格式的工作参数"
          v-model="editableWorkSettings"
        />
      </div>
      <div v-else>加载配置中...</div>
      <template #footer>
        <el-button @click="showConfigureDialog = false">取消</el-button>
        <el-button type="primary" @click="saveWorkSettings">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'; // For notifications
import { 
  fetchDevices, 
  fetchDeviceDetails, 
  updateDeviceWorkSettings 
} from '../services/api';

// 定义设备数据接口
interface Device {
  _id: string;
  deviceSN: string;
  deviceName?: string;
  ipAddress?: string; // IP reported by device itself (e.g. from workSettings or initial registration)
  onlineStatus: boolean;
  lastKeepaliveAt?: string | null;
  statusIpAddress?: string | null; // IP from where the last keepalive was received
  firmwareVersion?: string;
  workSettings?: any; // Can be a complex object
  // Add other fields from Device model + DeviceStatus model as needed for display
  manufacturer?: string;
  productionDate?: string;
  macAddress?: string;
  // etc.
}

const loading = ref(false);
const deviceList = ref<Device[]>([]);

const showDetailsDialog = ref(false);
const selectedDeviceDetails = ref<Device | null>(null);

const showConfigureDialog = ref(false);
const selectedDeviceForConfig = ref<Device | null>(null);
const currentWorkSettings = ref<any>(null);
const editableWorkSettings = ref(''); // For editing workSettings as JSON string

const formatDateTime = (dateTimeString: string | null | undefined) => {
  if (!dateTimeString) return 'N/A';
  try {
    return new Date(dateTimeString).toLocaleString();
  } catch (e) {
    return dateTimeString; // if parsing fails, return original string
  }
};

// 获取设备列表
const loadDevices = async () => {
  loading.value = true;
  try {
    deviceList.value = await fetchDevices();
  } catch (error: any) {
    console.error("获取设备列表失败:", error);
    ElMessage.error(`获取设备列表失败: ${error.message || '未知错误'}`);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDevices();
});

// 处理查看详情操作
const handleViewDetails = async (device: Device) => {
  showDetailsDialog.value = true;
  selectedDeviceDetails.value = null; // Clear previous details
  try {
    selectedDeviceDetails.value = await fetchDeviceDetails(device.deviceSN);
    console.log('查看设备详情 (View Device Details):', selectedDeviceDetails.value);
  } catch (error: any) {
    console.error(`获取设备 ${device.deviceSN} 详情失败:`, error);
    ElMessage.error(`获取设备详情失败: ${error.message || '未知错误'}`);
    showDetailsDialog.value = false; // Close dialog on error
  }
};

// 处理参数配置操作
const handleConfigure = async (device: Device) => {
  showConfigureDialog.value = true;
  selectedDeviceForConfig.value = device;
  currentWorkSettings.value = null; // Clear previous
  editableWorkSettings.value = '';
  try {
    const details = await fetchDeviceDetails(device.deviceSN);
    currentWorkSettings.value = details.workSettings || {};
    editableWorkSettings.value = JSON.stringify(currentWorkSettings.value, null, 2);
    console.log('配置设备参数 (Configure Device Parameters), 当前参数 (Current Parameters):', currentWorkSettings.value);
  } catch (error: any) {
    console.error(`获取设备 ${device.deviceSN} 配置失败:`, error);
    ElMessage.error(`获取设备配置失败: ${error.message || '未知错误'}`);
    showConfigureDialog.value = false; // Close dialog on error
  }
};

const saveWorkSettings = async () => {
  if (!selectedDeviceForConfig.value || !editableWorkSettings.value) return;
  
  let parsedSettings;
  try {
    parsedSettings = JSON.parse(editableWorkSettings.value);
  } catch (jsonError) {
    ElMessage.error('工作参数不是有效的JSON格式。 (Work settings are not valid JSON format.)');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要为设备 ${selectedDeviceForConfig.value.deviceSN} 保存新的工作参数吗？`,
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // Proceed with saving
    await updateDeviceWorkSettings(selectedDeviceForConfig.value.deviceSN, parsedSettings);
    ElMessage.success('工作参数已成功更新。 (Work settings updated successfully.)');
    showConfigureDialog.value = false;
    // Optionally, refresh the device list or the specific device's details
    loadDevices(); // Or update just the one device in the list
  } catch (error: any) {
    // If error is 'cancel', it means ElMessageBox was cancelled, do nothing.
    if (error !== 'cancel') {
       console.error(`保存设备 ${selectedDeviceForConfig.value.deviceSN} 工作参数失败:`, error);
       ElMessage.error(`保存工作参数失败: ${error.message || '未知错误'}`);
    }
  }
};


// 处理远程操作
const handleRemoteOperation = (device: Device) => {
  console.log('执行远程操作 (Execute Remote Operation):', device.deviceSN);
  ElMessage.info(`远程操作功能待实现 (Remote operation for ${device.deviceSN} to be implemented)`);
  // TODO: 实现远程操作的逻辑 (例如，显示可用远程命令列表)
};

</script>

<style scoped>
.device-management-view {
  padding: 20px;
}
/* 可以添加更多自定义样式 */
.el-table {
  margin-top: 20px;
}
.el-dialog div {
  max-height: 60vh;
  overflow-y: auto;
}
.el-dialog pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap; /* Allows wrapping of long lines */
  word-break: break-all; /* Breaks long words/strings */
}
</style>
