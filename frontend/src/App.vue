<template>
  <el-container class="app-layout">
    <el-header class="app-header">
      物联网(IoT)管理平台
      <!-- Internet of Things (IoT) Management Platform -->
    </el-header>
    <el-container>
      <el-aside width="200px" class="app-sidebar">
        <!-- 导航菜单 -->
        <!-- Navigation Menu -->
        <el-menu default-active="1" class="el-menu-vertical-demo">
          <el-menu-item index="1">
            <router-link to="/">首页</router-link>
            <!-- Home -->
          </el-menu-item>
          <el-menu-item index="2">
            <router-link to="/devices">设备管理</router-link>
            <!-- Device Management -->
          </el-menu-item>
          <el-menu-item index="3">
            <router-link to="/people">人员管理</router-link>
            <!-- People Management -->
          </el-menu-item>
          <el-menu-item index="4">
            <router-link to="/records">记录查看</router-link>
            <!-- Record Viewing -->
          </el-menu-item>
          <!-- 更多导航项可以在此添加 -->
          <!-- More navigation items can be added here -->
        </el-menu>
      </el-aside>
      <el-main class="app-main-content">
        <!-- 路由出口，匹配到的组件将在此渲染 -->
        <!-- Router outlet, matched components will be rendered here -->
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
// 按需导入Element Plus组件可以减小打包体积，但在此示例中我们已在main.ts全局注册
// Importing Element Plus components on demand can reduce bundle size,
// but in this example, we have registered it globally in main.ts.
// import { ElContainer, ElHeader, ElAside, ElMain, ElMenu, ElMenuItem } from 'element-plus';

export default defineComponent({
  name: 'App', // 组件名称 (Component name)
  components: {
    // 如果选择按需导入Element Plus组件，请在此处注册它们
    // If you choose to import Element Plus components on demand, register them here:
    // ElContainer,
    // ElHeader,
    // ElAside,
    // ElMain,
    // ElMenu,
    // ElMenuItem
  }
});
</script>

<style>
/* 全局样式或特定于App.vue的样式 */
/* Global styles or styles specific to App.vue */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-layout {
  height: 100vh; /* 使布局占据整个视口高度 (Make the layout occupy the entire viewport height) */
}

.app-header {
  background-color: #409EFF; /* Element Plus 主题蓝色 (Element Plus theme blue) */
  color: white;
  line-height: 60px; /* 垂直居中头部文字 (Vertically center header text) */
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.app-sidebar {
  background-color: #f4f4f5; /* 浅灰色背景 (Light gray background) */
  border-right: 1px solid #e6e6e6; /* 右边框线 (Right border line) */
}

.app-sidebar .el-menu {
  border-right: none; /* 移除菜单自身的右边框，因为侧边栏已有 (Remove menu's own right border as sidebar has one) */
}

.app-sidebar .el-menu-item a {
  text-decoration: none; /* 移除链接下划线 (Remove link underline) */
  color: inherit; /* 继承父元素颜色 (Inherit parent element color) */
  display: block; /* 使链接填满整个菜单项 (Make the link fill the entire menu item) */
  padding: 0 20px; /* 菜单项内边距 (Menu item padding) */
}

.app-sidebar .el-menu-item.is-active a {
  color: #409EFF; /* 活动菜单项的文本颜色 (Text color for active menu item) */
}

.app-sidebar .el-menu-item:hover {
  background-color: #ecf5ff; /* 鼠标悬停背景色 (Hover background color) */
}

.app-main-content {
  padding: 20px; /* 主内容区域内边距 (Main content area padding) */
  background-color: #fff; /* 主内容区背景色 (Main content area background color) */
}
</style>
