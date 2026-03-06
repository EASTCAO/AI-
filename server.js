const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.')); // 提供静态文件服务

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行正常' });
});

// 代理通义千问 API
app.post('/api/qwen', async (req, res) => {
    try {
        const apiKey = process.env.QWEN_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: '服务器未配置 API Key'
            });
        }

        const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('API 调用失败:', error);
        res.status(500).json({
            error: '服务器错误: ' + error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📝 API 端点: http://localhost:${PORT}/api/qwen`);
});
