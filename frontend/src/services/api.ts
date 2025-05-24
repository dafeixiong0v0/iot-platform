// frontend/src/services/api.ts
import axios from 'axios';

// 创建 Axios 实例
// Create Axios instance
const apiClient = axios.create({
  baseURL: '/', // 后端API的基础URL。由于Vite代理已按路径配置，这里设为根路径。
                // The base URL for the backend API. Since Vite proxy is configured by path, this is set to the root path.
                // 例如 /Device, /People, /Record 将被正确代理。
                // For example, /Device, /People, /Record will be correctly proxied.
  headers: {
    'Content-Type': 'application/json'
  }
});

// 示例：获取设备列表的函数 (占位)
// Example: Function to get device list (placeholder)
export const fetchDevices = async () => {
  try {
    // 实际的API调用 (Actual API call)
    // const response = await apiClient.get('/Device/SomeDeviceListEndpoint'); // 假设有这样一个API (Assuming such an API exists)
    // return response.data;
    console.log("调用 fetchDevices (占位) - 调用 apiClient.get(...) (Calling fetchDevices (placeholder) - Calling apiClient.get(...))");
    // 模拟API调用成功并返回空数组
    // Simulate successful API call and return an empty array
    return Promise.resolve([]); 
  } catch (error) {
    console.error("获取设备列表失败: (Failed to get device list:)", error);
    throw error;
  }
};

// TODO: 添加更多与后端API交互的函数，例如:
// TODO: Add more functions to interact with the backend API, for example:
// - 设备心跳 (Device keepalive)
// - 上传/下载工作参数 (Upload/Download work parameters)
// - 人员列表下载/删除 (Personnel list download/delete)
// - 记录上传 (Record upload)

// 导出 API 客户端或各个方法
// Export API client or individual methods
export default apiClient;
