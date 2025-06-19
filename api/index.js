const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const { kv } = require('@vercel/kv');

const app = express();

app.use(cors());
app.use(express.json());

// 检查KV连接
const checkKVConnection = async () => {
    try {
        // 尝试设置一个测试值
        const testKey = `test_${Date.now()}`;
        await kv.set(testKey, 'test');
        const testValue = await kv.get(testKey);
        await kv.del(testKey);

        if (testValue !== 'test') {
            console.error('KV connection test failed: value mismatch');
            return false;
        }

        console.log('Successfully connected to Vercel KV');
        return true;
    } catch (error) {
        console.error('Failed to connect to Vercel KV:', error);
        return false;
    }
};

// 检查环境变量
const checkEnvironment = () => {
    const requiredEnvVars = ['KV_URL', 'KV_REST_API_URL', 'KV_REST_API_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars);
        return false;
    }
    
    return true;
};

// 保存HTML内容并生成唯一ID
app.post('/api/save', async (req, res) => {
    try {
        // 检查环境变量
        if (!checkEnvironment()) {
            console.error('Environment variables not properly configured');
            return res.status(500).json({ error: '服务器配置错误，请联系管理员' });
        }

        const { html } = req.body;
        if (!html) {
            return res.status(400).json({ error: '需要提供HTML内容' });
        }

        if (html.length > 1000000) { // 1MB限制
            return res.status(400).json({ error: 'HTML内容过大' });
        }

        // 检查KV连接
        const isConnected = await checkKVConnection();
        if (!isConnected) {
            console.error('KV storage is not available');
            return res.status(500).json({ error: '存储服务暂时不可用，请稍后重试' });
        }

        const id = nanoid(10);
        console.log(`Attempting to save HTML content with ID: ${id}`);
        
        // 使用KV存储
        await kv.set(id, html);
        console.log(`Successfully saved HTML content with ID: ${id}`);
        
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://${req.get('host')}`;
        const url = `${host}/view/${id}`;
        console.log(`Generated share URL: ${url}`);
        
        res.json({ id, url });
    } catch (error) {
        console.error('Error saving HTML:', error);
        res.status(500).json({ error: '保存失败，请稍后重试' });
    }
});

// 获取HTML内容
app.get('/api/html/:id', async (req, res) => {
    try {
        if (!checkEnvironment()) {
            return res.status(500).json({ error: '服务器配置错误，请联系管理员' });
        }

        const { id } = req.params;
        console.log(`Attempting to fetch HTML content for ID: ${id}`);
        
        const isConnected = await checkKVConnection();
        if (!isConnected) {
            return res.status(500).json({ error: '存储服务暂时不可用，请稍后重试' });
        }

        const html = await kv.get(id);
        
        if (!html) {
            console.log(`HTML content not found for ID: ${id}`);
            return res.status(404).json({ error: '未找到对应的HTML内容' });
        }
        
        console.log(`Successfully retrieved HTML content for ID: ${id}`);
        res.json({ html });
    } catch (error) {
        console.error('Error fetching HTML:', error);
        res.status(500).json({ error: '获取内容失败，请稍后重试' });
    }
});

// 渲染HTML页面
app.get('/view/:id', async (req, res) => {
    try {
        if (!checkEnvironment()) {
            return res.status(500).send('服务器配置错误，请联系管理员');
        }

        const { id } = req.params;
        console.log(`Attempting to render HTML content for ID: ${id}`);
        
        const isConnected = await checkKVConnection();
        if (!isConnected) {
            return res.status(500).send('存储服务暂时不可用，请稍后重试');
        }

        const html = await kv.get(id);
        
        if (!html) {
            console.log(`HTML content not found for ID: ${id}`);
            return res.status(404).send('页面未找到');
        }
        
        console.log(`Successfully rendering HTML content for ID: ${id}`);
        res.send(html);
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('服务器错误，请稍后重试');
    }
});

// 健康检查接口
app.get('/api/health', async (req, res) => {
    const envCheck = checkEnvironment();
    if (!envCheck) {
        return res.status(500).json({ 
            status: 'unhealthy',
            error: 'Missing environment variables'
        });
    }

    const isConnected = await checkKVConnection();
    if (isConnected) {
        res.json({ status: 'healthy' });
    } else {
        res.status(500).json({ 
            status: 'unhealthy',
            error: 'KV connection failed'
        });
    }
});

module.exports = app; 