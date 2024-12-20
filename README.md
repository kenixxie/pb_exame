# 在线考试系统

这是一个基于React和Node.js的在线考试系统，支持单选题、多选题和判断题的练习和考试。

## 功能特点

- 用户认证：支持管理员和普通用户两种角色
- 题库管理：支持Excel文件导入题目
- 学习模式：可以查看所有题目并练习
- 考试模式：随机抽题组卷，自动评分
- 响应式设计：支持各种设备访问

## 系统要求

- Node.js 14.0+
- MongoDB 4.0+
- Windows Server 环境

## 安装步骤

1. 克隆项目到本地

2. 安装后端依赖
```bash
cd backend
npm install
```

3. 安装前端依赖
```bash
cd frontend
npm install
```

4. 配置环境变量
在backend目录下创建.env文件，添加以下配置：
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/exam_platform
JWT_SECRET=your_jwt_secret_key
ALLOWED_ORIGINS=http://localhost:3000,http://123.157.129.91:3000
```

5. 启动MongoDB数据库

6. 启动后端服务器
```bash
cd backend
node server.js
```

7. 启动前端开发服务器
```bash
cd frontend
npm start
```

## 默认账号

- 管理员账号：admin
- 管理员密码：admin

## Excel导入格式说明

### 单选题格式
- 题目
- 选项A
- 选项B
- 选项C
- 选项D
- 正确答案

### 多选题格式
- 题目
- 选项A
- 选项B
- 选项C
- 选项D
- 选项E
- 选项F
- 选项G
- 选项H
- 正确答案

### 判断题格式
- 题目
- 选项A
- 选项B
- 正确答案

## 部署说明

1. 构建前端项目
```bash
cd frontend
npm run build
```

2. 配置Nginx
```nginx
server {
    listen 80;
    server_name your_domain;

    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. 使用PM2启动后端服务
```bash
npm install -g pm2
cd backend
pm2 start server.js
```

## 注意事项

1. 请确保MongoDB服务已经启动
2. 确保所有端口（3000, 3001）未被占用
3. 首次运行时系统会自动创建管理员账号
4. Excel文件导入时请严格按照格式要求 