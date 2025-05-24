<template>
  <div class="people-management-view">
    <h2>人员管理</h2>
    <!-- 人员管理页面标题 -->
    <!-- People Management Page Title -->
    <div class="actions-bar" style="margin-bottom: 20px;">
      <!-- 操作栏，包含添加人员按钮 -->
      <!-- Actions bar, includes Add Person button -->
      <el-button type="primary" @click="handleAddPerson">添加人员</el-button>
      <!-- 添加人员按钮 -->
      <!-- Add Person Button -->
    </div>
    <el-table :data="peopleList" style="width: 100%" border stripe>
      <!-- Element Plus 表格，用于显示人员列表 -->
      <!-- Element Plus table for displaying the people list -->

      <el-table-column prop="userID" label="用户ID" width="120" />
      <!-- 表格列：用户ID -->
      <!-- Table Column: UserID -->

      <el-table-column prop="name" label="姓名" width="150" />
      <!-- 表格列：姓名 -->
      <!-- Table Column: Name -->

      <el-table-column prop="department" label="部门" width="150" />
      <!-- 表格列：部门 -->
      <!-- Table Column: Department -->

      <el-table-column prop="cardNum" label="卡号" width="150" />
      <!-- 表格列：卡号 -->
      <!-- Table Column: Card Number -->

      <el-table-column prop="accessType" label="角色" width="120">
        <!-- 表格列：角色，使用自定义模板显示文本 -->
        <!-- Table Column: Access Type, uses custom template to display text -->
        <template #default="scope">
          {{ formatAccessType(scope.row.accessType) }}
          <!-- 根据角色类型数字返回对应中文描述 -->
          <!-- Returns corresponding Chinese description based on access type number -->
        </template>
      </el-table-column>

      <el-table-column prop="expirationDate" label="有效期" width="180" />
      <!-- 表格列：有效期 -->
      <!-- Table Column: Expiration Date -->

      <el-table-column label="操作" width="220">
        <!-- 表格列：操作按钮，使用自定义模板 -->
        <!-- Table Column: Action Buttons, uses custom template -->
        <template #default="scope">
          <el-button size="small" @click="handleViewPersonDetails(scope.row)">详情</el-button>
          <!-- 详情按钮 -->
          <!-- Details Button -->
          <el-button size="small" type="primary" @click="handleEditPerson(scope.row)">编辑</el-button>
          <!-- 编辑按钮 -->
          <!-- Edit Button -->
          <el-button size="small" type="danger" @click="handleDeletePerson(scope.row)">删除</el-button>
          <!-- 删除按钮 -->
          <!-- Delete Button -->
        </template>
      </el-table-column>
    </el-table>
    <!-- TODO: 添加/编辑人员弹窗 -->
    <!-- Placeholder for future Add/Edit Person dialog -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
// 按需导入 Element Plus 组件。注意：如果已在 main.ts 全局注册，则此处导入主要用于类型提示或特定场景。
// Import Element Plus components on demand. Note: If globally registered in main.ts, importing here is mainly for type hinting or specific scenarios.
import { ElTable, ElTableColumn, ElButton } from 'element-plus';

// 定义人员数据接口
// Define the interface for person data
interface Person {
  id: string; // 唯一标识, 可以是 UserID + DeviceSN 组合或全局唯一ID (Unique identifier, can be UserID + DeviceSN combination or globally unique ID)
  userID: string; // 用户在设备上的ID (User ID on the device)
  name: string; // 姓名 (Name)
  department: string; // 部门 (Department)
  cardNum?: string; // 可选卡号 (Optional card number)
  accessType: number; // 0:普通人员；1:管理员; 2:黑名单 (0: Normal; 1: Admin; 2: Blacklist)
  expirationDate: string; // 权限截止日期 (字符串格式方便显示, 0 表示无期限) (Permission expiration date - string format for easy display, "永久" or a date string)
}

export default defineComponent({
  name: 'PeopleManagementView', // 组件名称 (Component name)
  components: {
    // 注册按需导入的 Element Plus 组件
    // Register on-demand imported Element Plus components
    ElTable,
    ElTableColumn,
    ElButton,
  },
  setup() {
    // Vue 3 Composition API setup function

    // 模拟人员列表数据
    // Simulate people list data
    const peopleList = ref<Person[]>([
      { id: 'user1', userID: '1001', name: '张三', department: '研发部', cardNum: '88881001', accessType: 0, expirationDate: '永久' },
      { id: 'user2', userID: '1002', name: '李四', department: '市场部', cardNum: '88881002', accessType: 1, expirationDate: '2025-12-31' },
      { id: 'user3', userID: '1003', name: '王五', department: '行政部', cardNum: 'N/A', accessType: 2, expirationDate: '永久' }, // 卡号示例为N/A (Card number example as N/A)
      { id: 'user4', userID: '2001', name: '赵六', department: '技术支持部', accessType: 0, expirationDate: '2024-08-15' },
    ]);

    // TODO: 在后续步骤中，将替换为从API获取数据的逻辑
    // In subsequent steps, this will be replaced with logic to fetch data from the API
    // onMounted(async () => {
    //   try {
    //     // peopleList.value = await fetchPeople(); // 假设 fetchPeople 在 api.ts 中定义并返回 Person[] (Assuming fetchPeople is defined in api.ts and returns Person[])
    //   } catch (error) {
    //     console.error("获取人员列表失败: (Failed to fetch people list:)", error);
    //   }
    // });

    // 格式化角色类型用于显示
    // Format access type for display
    const formatAccessType = (type: number): string => {
      switch (type) {
        case 1: return '管理员'; // Admin
        case 2: return '黑名单'; // Blacklist
        case 0:
        default: return '普通人员'; // Normal
      }
    };

    // 处理添加人员操作
    // Handle add person operation
    const handleAddPerson = () => {
      console.log('打开添加人员弹窗 (Open add person dialog)');
      // TODO: 实现添加人员的逻辑 (例如，通过弹窗)
      // Implement logic for adding a person (e.g., via dialog)
    };

    // 处理编辑人员操作
    // Handle edit person operation
    const handleEditPerson = (person: Person) => {
      console.log('编辑人员 (Edit Person):', person.userID);
      // TODO: 实现编辑人员的逻辑 (例如，通过弹窗预填数据)
      // Implement logic for editing a person (e.g., pre-fill data in a dialog)
    };

    // 处理删除人员操作
    // Handle delete person operation
    const handleDeletePerson = (person: Person) => {
      console.log('删除人员 (Delete Person):', person.userID);
      // TODO: 实现删除人员的逻辑 (确认弹窗，然后调用API)
      // Implement logic for deleting a person (confirmation dialog, then call API)
    };

    // 处理查看人员详情操作
    // Handle view person details operation
    const handleViewPersonDetails = (person: Person) => {
      console.log('查看人员详情 (View Person Details):', person.userID);
      // TODO: 实现显示人员详细信息的逻辑 (例如，通过弹窗或跳转到详情页)
      // Implement logic to show person details (e.g., via dialog or navigation to a details page)
    };

    // 返回组件模板所需的数据和方法
    // Return data and methods needed by the component template
    return {
      peopleList,
      formatAccessType,
      handleAddPerson,
      handleEditPerson,
      handleDeletePerson,
      handleViewPersonDetails,
    };
  },
});
</script>

<style scoped>
.people-management-view {
  padding: 20px; /* 视图内边距 (Padding for the view) */
}
.actions-bar {
  display: flex;
  justify-content: flex-end; /* 将按钮靠右对齐 (Align button to the right) */
}
/* 可以添加更多自定义样式 */
/* More custom styles can be added here */
</style>
