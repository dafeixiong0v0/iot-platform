// frontend/src/services/api.ts
import axios, { AxiosError } from 'axios';

// --- TypeScript Interfaces ---
interface ApiResponse<T = any> {
  Success: 0 | 1;
  Message?: string;
  devices?: T[];
  device?: T;
  people?: T[];
  person?: T;
  command?: T; // For retry-command and enqueue-command in internalRoutes
}

// Basic Device interface (can be expanded)
interface Device {
  _id: string;
  deviceSN: string;
  deviceName?: string;
  onlineStatus?: boolean;
  lastKeepaliveAt?: string | null;
  statusIpAddress?: string | null;
  workSettings?: any;
  // other fields from Device model
}

// Basic Person interface (can be expanded)
interface Person {
  _id: string;
  userID: string;
  name: string;
  // other fields from People model
}


// 创建 Axios 实例
// Create Axios instance
const apiClient = axios.create({
  baseURL: '/api', // 后端API的基础URL。由于Vite代理已按路径配置，这里设为根路径。
  // The base URL for the backend API. Since Vite proxy is configured by path, this is set to the root path.
  // 例如 /Device, /People, /Record 将被正确代理。
  // For example, /Device, /People, /Record will be correctly proxied.
  headers: {
    'Content-Type': 'application/json'
  }
});

// --- Device Management Functions ---

export const fetchDevices = async (): Promise<Device[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Device>>('/internal/devices');
    if (response.data.Success === 1 && response.data.devices) {
      return response.data.devices;
    } else {
      throw new Error(response.data.Message || 'Failed to fetch devices');
    }
  } catch (error) {
    console.error("获取设备列表失败 (Error fetching devices):", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

export const fetchDeviceDetails = async (deviceSN: string): Promise<Device> => {
  try {
    const response = await apiClient.get<ApiResponse<Device>>(`/internal/devices/${deviceSN}`);
    if (response.data.Success === 1 && response.data.device) {
      return response.data.device;
    } else {
      throw new Error(response.data.Message || `Failed to fetch details for device ${deviceSN}`);
    }
  } catch (error) {
    console.error(`获取设备 ${deviceSN} 详情失败 (Error fetching device ${deviceSN} details):`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

export const updateDevice = async (deviceSN: string, deviceData: any): Promise<Device> => {
  try {
    const response = await apiClient.put<ApiResponse<Device>>(`/internal/devices/${deviceSN}`, deviceData);
    if (response.data.Success === 1 && response.data.device) {
      return response.data.device;
    } else {
      throw new Error(response.data.Message || `Failed to update device ${deviceSN}`);
    }
  } catch (error) {
    console.error(`更新设备 ${deviceSN} 失败 (Error updating device ${deviceSN}):`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

export const updateDeviceWorkSettings = async (deviceSN: string, workSettings: any): Promise<Device> => {
  try {
    const response = await apiClient.put<ApiResponse<Device>>(`/internal/devices/${deviceSN}/work-settings`, workSettings);
    if (response.data.Success === 1 && response.data.device) {
      return response.data.device;
    } else {
      throw new Error(response.data.Message || `Failed to update work settings for device ${deviceSN}`);
    }
  } catch (error) {
    console.error(`更新设备 ${deviceSN} 工作参数失败 (Error updating work settings for device ${deviceSN}):`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

// --- People Management Functions ---

export const fetchPeople = async (): Promise<Person[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Person>>('/internal/people');
    if (response.data.Success === 1 && response.data.people) {
      return response.data.people;
    } else {
      throw new Error(response.data.Message || 'Failed to fetch people');
    }
  } catch (error) {
    console.error("获取人员列表失败 (Error fetching people):", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

export const fetchPersonDetails = async (personId: string): Promise<Person> => {
  try {
    const response = await apiClient.get<ApiResponse<Person>>(`/internal/people/${personId}`);
    if (response.data.Success === 1 && response.data.person) {
      return response.data.person;
    } else {
      throw new Error(response.data.Message || `Failed to fetch details for person ${personId}`);
    }
  } catch (error) {
    console.error(`获取人员 ${personId} 详情失败 (Error fetching person ${personId} details):`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

export const createPerson = async (personData: any): Promise<Person> => {
  try {
    const response = await apiClient.post<ApiResponse<Person>>('/internal/people', personData);
    if (response.data.Success === 1 && response.data.person) {
      return response.data.person;
    } else {
      throw new Error(response.data.Message || 'Failed to create person');
    }
  } catch (error) {
    console.error("创建人员失败 (Error creating person):", error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

export const updatePerson = async (personId: string, personData: any): Promise<Person> => {
  try {
    const response = await apiClient.put<ApiResponse<Person>>(`/internal/people/${personId}`, personData);
    if (response.data.Success === 1 && response.data.person) {
      return response.data.person;
    } else {
      throw new Error(response.data.Message || `Failed to update person ${personId}`);
    }
  } catch (error) {
    console.error(`更新人员 ${personId} 失败 (Error updating person ${personId}):`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};

export const deletePerson = async (personId: string): Promise<{ Success: 1, Message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<never>>(`/internal/people/${personId}`);
    if (response.data.Success === 1) {
      return { Success: 1, Message: response.data.Message || `Person ${personId} deleted successfully` };
    } else {
      throw new Error(response.data.Message || `Failed to delete person ${personId}`);
    }
  } catch (error) {
    console.error(`删除人员 ${personId} 失败 (Error deleting person ${personId}):`, error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      if (axiosError.response?.data?.Message) {
        throw new Error(axiosError.response.data.Message);
      }
    }
    throw error;
  }
};


// 导出 API 客户端或各个方法
// Export API client or individual methods
export default apiClient;
