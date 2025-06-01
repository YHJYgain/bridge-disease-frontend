# 桥梁病害检测与分割系统前端

## 项目介绍

桥梁病害检测与分割系统前端是一个基于 Vue 3 和 Vite 开发的 Web 应用，作为桥梁病害检测系统的用户界面，提供了直观、友好的交互体验。该系统与后端服务配合，实现对桥梁结构的病害检测、分割和评估功能，帮助工程师和管理人员高效地进行桥梁健康监测和维护决策。

## 主要功能

- **用户管理**：支持用户注册、登录、找回密码和个人中心管理
- **病害检测分割**：通过简单的步骤选择模型和媒体文件，执行桥梁病害检测和分割
- **检测分割记录**：查看和管理历史检测分割记录，分析检测分割结果
- **媒体库管理**：上传、查看和管理图片、视频等媒体文件
- **模型库管理**：（开发人员）上传和管理病害检测分割模型
- **用户管理**：（管理员）管理系统用户，包括添加、编辑和禁用用户
- **操作日志**：（管理员）查看系统操作日志，监控系统活动
- **数据可视化**：通过图表直观展示检测分割数据和统计信息

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **路由管理**：Vue Router
- **HTTP 客户端**：Axios
- **数据可视化**：ECharts
- **数据导出**：XLSX

## 安装指南

### 环境要求

- Node.js 16+
- npm 8+

### 安装步骤

1. 克隆项目到本地

```bash
git clone https://github.com/YHJYgain/bridge-disease-frontend.git
cd bridge-disease-frontend
```

2. 安装依赖包

```bash
npm install
```

3. 配置后端 API 地址

编辑`src/utils/request.js`文件，修改 baseURL：

```javascript
const request = axios.create({
  baseURL: 'http://your-backend-api-url',  // 修改为你的后端 API 地址
  timeout: 600000,
})
```

4. 启动开发服务器

可以使用以下两种方式之一启动开发服务器：

```bash
npm run serve
```

或者直接双击项目根目录下的`start.bat`批处理文件：

```bash
# 双击运行 start.bat 文件
# 该批处理文件会自动执行 npm run serve 命令并在完成后暂停窗口
```

5. 构建生产版本

同样地，构建生产版本也有两种方式：

```bash
npm run build
```

或者直接双击项目根目录下的`build.bat`批处理文件：

```bash
# 双击运行 build.bat 文件
# 该批处理文件会自动执行 npm run build 命令并在完成后暂停窗口
```

## 项目结构

```
.
├── docs/                 # 项目文档
│   ├── 3.3.1_用例图.md    # 用例图文档
│   ├── 3.3.2_状态图.md    # 状态图文档
│   ├── 3.3.3_顺序图.md    # 顺序图文档
│   └── 3.3.4_系统架构图.md # 系统架构图文档
├── public/               # 静态资源
│   └── bridge-disease.svg # 项目图标
├── src/                  # 源代码
│   ├── assets/           # 资源文件
│   ├── components/       # 公共组件
│   │   ├── BreadcrumbNav.vue      # 面包屑导航
│   │   ├── ContactSupportCard.vue # 联系支持卡片
│   │   ├── FooterComponent.vue    # 页脚组件
│   │   ├── HeaderComponent.vue    # 页头组件
│   │   ├── ParticleBackground.vue # 粒子背景
│   │   ├── SidebarMenu.vue        # 侧边栏菜单
│   │   └── StatisticsCharts.vue   # 统计图表
│   ├── router/           # 路由配置
│   │   └── index.js      # 路由定义
│   ├── stores/           # 状态管理
│   │   ├── resourceStore.js # 资源状态
│   │   ├── sidebarStore.js  # 侧边栏状态
│   │   └── userStore.js     # 用户状态
│   ├── utils/            # 工具函数
│   │   ├── avatarUtils.js         # 头像处理
│   │   ├── dateTimeFormatter.js   # 日期时间格式化
│   │   ├── detailFetcher.js       # 数据获取
│   │   └── request.js             # HTTP 请求
│   ├── views/            # 页面视图
│   │   ├── DetectionRecordsView.vue # 检测分割记录
│   │   ├── DiseaseDetectionView.vue # 病害检测分割
│   │   ├── ForgotPasswordView.vue   # 找回密码
│   │   ├── HomeView.vue             # 首页
│   │   ├── LoginView.vue            # 登录
│   │   ├── MediaLibraryView.vue     # 媒体库
│   │   ├── ModelLibraryView.vue     # 模型库
│   │   ├── OperationLogsView.vue    # 操作日志
│   │   ├── RegisterView.vue         # 注册
│   │   ├── UserCenterView.vue       # 用户中心
│   │   └── UserManagementView.vue   # 用户管理
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── build.bat             # 构建批处理文件
├── index.html            # HTML 模板
├── jsconfig.json         # JS 配置
├── package.json          # 项目依赖
├── start.bat             # 启动批处理文件
├── vite.config.js        # Vite 配置
└── README.md             # 项目说明
```

## 与后端交互

前端通过 RESTful API 与后端服务进行通信，主要包括以下接口：

- 用户认证：登录、注册、找回密码、刷新 Token
- 用户管理：获取/更新用户信息、管理用户
- 媒体管理：上传、获取、删除媒体等
- 模型管理：上传、获取、删除模型等
- 病害检测分割：提交检测分割任务、获取检测分割结果
- 检测分割记录：获取历史检测分割记录和详情
- 系统管理：获取操作日志、系统统计数据

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Edge (最新版)
- Safari (最新版)

## 联系方式

如有问题或建议，请联系项目维护者。
