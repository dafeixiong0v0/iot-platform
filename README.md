# IoT Platform

This is an IoT platform built with Node.js, Express, and MongoDB. The frontend will be developed using Vue.js.

## Project Structure

- `src/`: Backend source code
  - `api/`: API route handlers
  - `models/`: Database models
  - `services/`: Business logic
  - `config/`: Configuration files
- `public/`: Frontend build (Vue.js)
- `tests/`: Test files
- `DESIGN_CHOICES.md`: Contains design decisions like database choice.

## Getting Started

(Instructions to be added later)

## Contributing

(Contribution guidelines to be added later)

## 开发环境运行 (Development Setup)

### 后端 (Node.js)
```bash
# 进入项目根目录
# cd <project-root>

# 安装依赖
npm install

# 启动开发服务器 (假设 package.json 中有 "dev" 脚本，例如使用 nodemon)
# npm run dev
# 或者直接运行
npm start 
# 后端服务默认运行在 http://localhost:3000
```

### 前端 (Vue3 + TypeScript)
```bash
# 进入前端项目目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 前端服务通常会运行在 http://localhost:5173 (Vite 默认) 或类似端口
# API 请求会自动代理到后端 http://localhost:3000 (已在 vite.config.ts 中配置)
```

## 测试 (Testing)

### 后端测试 (Jest)
```bash
# 在项目根目录运行
npm run test:backend
```

### 前端单元测试 (Jest + Vue Test Utils)
```bash
# 进入前端项目目录
cd frontend
npm test
```
<!-- 添加中文注释 -->
<!-- 以上是如何在本地开发环境中分别设置和运行后端及前端服务的说明，以及如何执行各自的测试套件。 -->

## 使用 Docker Compose 运行 (Running with Docker Compose)

本节介绍如何使用 Docker Compose 快速构建和运行整个应用（包括后端、前端和MongoDB数据库）。

### 首次构建和启动服务 (First-time Build and Start)

```bash
docker-compose up --build -d
```
- **说明 (Explanation):** 此命令会根据 `docker-compose.yml` 的配置首次构建所有服务 (前端、后端) 的 Docker 镜像，并以后台分离模式 (`-d`) 启动所有容器 (包括 MongoDB)。如果镜像已存在且 Dockerfile 未更改，`--build` 可能不会重新构建。

### 查看服务日志 (Viewing Service Logs)

- **后端服务日志 (Backend Service Logs):**
  ```bash
  docker-compose logs -f backend
  ```
- **前端服务日志 (Frontend Service Logs):**
  ```bash
  docker-compose logs -f frontend
  ```
- **MongoDB 服务日志 (MongoDB Service Logs):**
  ```bash
  docker-compose logs -f mongo_db
  ```
- **说明 (Explanation):** 上述命令用于查看特定服务的实时日志输出 (`-f` 表示持续关注)。这对于监控应用状态和调试问题非常有用。

### 停止并移除容器 (Stopping and Removing Containers)

```bash
docker-compose down
```
- **说明 (Explanation):** 此命令会停止并移除由 `docker-compose up` 命令创建的所有容器和相关网络。
- **移除数据卷 (Removing Volumes):** 如果您希望同时移除 MongoDB 使用的数据卷 (即删除所有数据库数据)，请使用 `docker-compose down -v`。

### MongoDB 数据持久化 (MongoDB Data Persistence)

- **说明 (Explanation):** MongoDB 的数据通过 Docker 命名数据卷 `mongo_data` (在 `docker-compose.yml` 中定义) 进行持久化。这意味着即使您使用 `docker-compose down` (不带 `-v`) 停止并移除了 MongoDB 容器，数据仍然保留在宿主机的 Docker 管理的卷中。当您下次使用 `docker-compose up` 启动服务时，MongoDB 会重新加载这些数据。
- **彻底删除数据 (Completely Deleting Data):** 要彻底删除 MongoDB 的数据，您需要移除 `mongo_data` 数据卷。可以使用 `docker-compose down -v` (如上所述)，或者手动查找并删除该卷 (例如，使用 `docker volume ls` 查找卷名，然后 `docker volume rm <your_project_directory_name>_mongo_data`)。卷名通常是 `<项目目录名>_mongo_data`。

### 访问应用 (Accessing the Application)

- **前端应用 (Frontend Application):**
  在浏览器中访问 (Access in browser): `http://localhost:8080`
  (此端口映射在 `docker-compose.yml` 文件中为 `frontend` 服务配置)

- **后端 API (Backend API):**
  如果需要直接访问后端 API (例如，使用 Postman 或 curl): `http://localhost:3000`
  (此端口映射在 `docker-compose.yml` 文件中为 `backend` 服务配置)
