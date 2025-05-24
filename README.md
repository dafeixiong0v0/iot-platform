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

## 部署 (Deployment)

### 使用 Docker Hub 和 VPS 进行部署 (Deploying with Docker Hub and a VPS)

本指南将引导您完成将物联网平台部署到您自己的 VPS (Virtual Private Server) 上，并使用 Docker Hub 作为 Docker 镜像仓库的整个流程。

**前提条件:**
*   您已经有一个可以运行 Docker 的 VPS (请参考前文的 "VPS 服务器准备说明")。
*   您已经在本地构建了后端 (`yourdockerhubusername/iot-backend:latest`) 和前端 (`yourdockerhubusername/iot-frontend:latest`) 的 Docker 镜像，并将它们推送到了您的 Docker Hub 账户 (请参考前文的 "本地准备与镜像构建/推送说明")。请务必将 `yourdockerhubusername` 替换为您的实际 Docker Hub 用户名。

**部署步骤:**

1.  **准备 `docker-compose.vps.yml` 文件:**
    *   本项目根目录下提供了一个 `docker-compose.vps.yml` 文件，这是专门为 VPS 部署定制的 Docker Compose 配置。它假定您会从 Docker Hub 拉取预构建的镜像。
    *   您需要将此 `docker-compose.vps.yml` 文件上传到您的 VPS 服务器。您可以使用 `scp` 命令，或者在 VPS 上克隆整个 Git 仓库，然后找到这个文件。
        ```bash
        # 示例：使用 scp 从本地上传 (在本地机器执行)
        # scp docker-compose.vps.yml your_vps_user@your_vps_ip:/path/to/your/deployment_directory/
        ```
    *   在 VPS 上，您可以选择将 `docker-compose.vps.yml` 重命名为 `docker-compose.yml` 以简化命令，或者在执行 `docker-compose` 命令时始终使用 `-f docker-compose.vps.yml` 参数指定文件。为方便起见，以下命令将假定您已将其重命名或链接为 `docker-compose.yml`，或者您会相应地调整命令。

2.  **在 VPS 上拉取 Docker 镜像 (可选但推荐):**
    在启动服务之前，可以先从 Docker Hub 拉取最新的镜像，以确保使用的是最新版本。
    ```bash
    # 进入存放 docker-compose.vps.yml 文件的目录
    # cd /path/to/your/deployment_directory/
    docker-compose -f docker-compose.vps.yml pull
    # 如果已重命名为 docker-compose.yml:
    # docker-compose pull
    ```

3.  **在 VPS 上启动应用服务:**
    使用以下命令在后台启动所有服务 (后端、前端、MongoDB):
    ```bash
    docker-compose -f docker-compose.vps.yml up -d
    # 如果已重命名为 docker-compose.yml:
    # docker-compose up -d
    ```
    参数说明:
    *   `-f docker-compose.vps.yml`: (如果未重命名) 指定要使用的 Compose 文件。
    *   `up`: 创建并启动容器。
    *   `-d`: 后台分离模式运行。

4.  **检查服务状态:**
    您可以使用以下命令查看正在运行的容器的状态:
    ```bash
    docker-compose -f docker-compose.vps.yml ps
    # 如果已重命名为 docker-compose.yml:
    # docker-compose ps
    ```
    应能看到 `iot-backend`, `iot-frontend`, 和 `mongo_db` 服务都处于 `Up` (或 `running`) 状态。

5.  **查看服务日志:**
    如果需要查看特定服务的日志以进行调试:
    ```bash
    # 查看后端日志 (持续关注)
    docker-compose -f docker-compose.vps.yml logs -f backend

    # 查看前端日志
    docker-compose -f docker-compose.vps.yml logs -f frontend

    # 查看 MongoDB 日志
    docker-compose -f docker-compose.vps.yml logs -f mongo_db
    ```

6.  **访问应用:**
    *   **前端:** 打开浏览器，访问 `http://<您的VPS的IP地址>` (如果前端服务映射到80端口) 或 `http://<您的VPS的IP地址>:<映射的前端端口>`。
    *   **后端 API:** (通常不直接从公网访问，但前端会通过内部网络或代理访问) API 服务运行在容器的3000端口，并已映射到主机的3000端口。

**重要部署注意事项:**

*   **环境变量 `NODE_ENV`:** `docker-compose.vps.yml` 中已为后端服务设置 `NODE_ENV=production`。这对于性能和安全性很重要。
*   **MongoDB 安全:**
    *   `docker-compose.vps.yml` 中 MongoDB 的端口 (`27017`) 默认配置为仅允许从 VPS 本机 (`127.0.0.1`) 访问。这是一个基本的安全措施。
    *   强烈建议为您的生产 MongoDB 实例设置用户名和密码。您可以通过在 `mongo_db` 服务的 `environment` 部分取消注释并设置 `MONGO_INITDB_ROOT_USERNAME` 和 `MONGO_INITDB_ROOT_PASSWORD` 来实现。请务必使用强密码。
*   **数据持久化:** MongoDB 的数据存储在名为 `mongo_data` 的 Docker 卷中，确保了即使容器被删除，数据也不会丢失。
*   **防火墙:** 强烈建议在您的 VPS 上配置防火墙 (例如 `ufw`)，仅开放必要的端口，例如 SSH (通常是22)，HTTP (80)，HTTPS (443)。后端 API 端口 (3000) 和 MongoDB 端口 (27017) 通常不应直接暴露给公网，除非有特殊需求并已做好安全加固。
*   **域名和 HTTPS:** 对于生产环境，建议为您的应用配置域名，并使用 HTTPS 来确保通信安全。这通常涉及到使用反向代理 (如 Nginx 或 Caddy) 在前端容器之前处理 SSL 证书和域名路由。这部分配置超出了此基本部署指南的范围。

**停止服务:**
要停止并移除所有相关的容器、网络:
```bash
docker-compose -f docker-compose.vps.yml down
# 如果您还想删除 MongoDB 的数据卷 (警告: 这将删除所有数据库数据!):
# docker-compose -f docker-compose.vps.yml down -v
```
