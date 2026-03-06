# Zeabur 部署指南

## 📦 部署架构

本项目采用前后端一体化部署方案：
- **前端**：静态 HTML 页面
- **后端**：Node.js Express API 服务
- **API Key**：安全存储在 Zeabur 环境变量中

## 🚀 部署步骤

### 1. 准备工作

确保你已经：
- ✅ 注册 Zeabur 账号：https://zeabur.com
- ✅ 获取通义千问 API Key：https://bailian.console.aliyun.com/#/api-key
- ✅ 安装 Git（用于推送代码）

### 2. 推送代码到 GitHub

```bash
# 如果还没有推送，执行以下命令
git add .
git commit -m "feat: 添加后端 API 支持"
git push origin master
```

### 3. 在 Zeabur 创建项目

1. 登录 Zeabur 控制台
2. 点击 **New Project**（新建项目）
3. 选择 **Deploy from GitHub**
4. 授权 GitHub 并选择你的仓库：`EASTCAO/AI-`
5. 选择分支：`master`

### 4. 配置环境变量

在 Zeabur 项目设置中添加环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `QWEN_API_KEY` | `sk-xxxxxx...` | 你的通义千问 API Key |
| `PORT` | `3000` | 服务端口（可选，默认3000） |

**配置步骤：**
1. 进入项目 → 点击服务
2. 找到 **Environment Variables**（环境变量）
3. 点击 **Add Variable**
4. 输入变量名和值
5. 点击 **Save**

### 5. 部署服务

Zeabur 会自动检测到 `package.json` 并：
1. 自动安装依赖：`npm install`
2. 自动启动服务：`npm start`
3. 分配域名（如：`your-app.zeabur.app`）

### 6. 访问应用

部署完成后，Zeabur 会提供一个域名，例如：
```
https://your-app.zeabur.app
```

直接访问即可使用，无需配置 API Key（已在服务器端配置）。

## 🔧 本地开发测试

如果需要在本地测试后端功能：

### 1. 安装依赖
```bash
npm install
```

### 2. 创建 .env 文件
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 API Key：
```
QWEN_API_KEY=sk-xxxxxx...
PORT=3000
```

### 3. 启动服务
```bash
npm start
```

### 4. 访问应用
打开浏览器访问：`http://localhost:3000`

## 📝 API 接口说明

### 健康检查
```
GET /api/health
```

返回：
```json
{
  "status": "ok",
  "message": "服务运行正常"
}
```

### 通义千问代理
```
POST /api/qwen
```

请求体：与通义千问 API 格式相同
```json
{
  "model": "qwen-vl-plus",
  "messages": [...],
  "temperature": 0.1,
  "max_tokens": 2048
}
```

## 🔒 安全说明

✅ **API Key 安全性**
- API Key 存储在 Zeabur 环境变量中
- 前端代码中不包含任何 API Key
- 所有 API 请求通过后端代理，前端无法直接访问

✅ **CORS 配置**
- 后端已配置 CORS，允许跨域请求
- 生产环境建议限制允许的域名

## ⚠️ 注意事项

1. **环境变量必须配置**：`QWEN_API_KEY` 是必需的，否则服务无法正常工作
2. **API 额度监控**：定期检查通义千问 API 使用量，避免超额
3. **域名绑定**：Zeabur 支持绑定自定义域名
4. **日志查看**：在 Zeabur 控制台可以查看服务日志

## 🆘 常见问题

### Q: 部署后提示"服务器未配置 API Key"
**A:** 检查 Zeabur 环境变量是否正确配置了 `QWEN_API_KEY`

### Q: API 调用失败
**A:**
1. 检查 API Key 是否有效
2. 检查账户余额是否充足
3. 查看 Zeabur 服务日志排查错误

### Q: 如何更新代码？
**A:**
```bash
git add .
git commit -m "更新说明"
git push origin master
```
Zeabur 会自动检测并重新部署。

### Q: 如何回滚到旧版本？
**A:** 在 Zeabur 控制台的 Deployments 页面可以选择历史版本回滚。

## 📞 技术支持

- Zeabur 文档：https://zeabur.com/docs
- 通义千问文档：https://help.aliyun.com/zh/dashscope/

---

部署完成后，你的 API Key 将完全隐藏在服务器端，前端用户无法获取！🎉
