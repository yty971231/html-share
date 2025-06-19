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
        await kv.ping();
        console.log('Successfully connected to Vercel KV');
        return true;
    } catch (error) {
        console.error('Failed to connect to Vercel KV:', error);
        return false;
    }
};

// 保存HTML内容并生成唯一ID
app.post('/api/save', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) {
            return res.status(400).json({ error: '需要提供HTML内容' });
        }

        // 检查KV连接
        const isConnected = await checkKVConnection();
        if (!isConnected) {
            return res.status(500).json({ error: '存储服务暂时不可用，请稍后重试' });
        }

        const id = nanoid(10);
        // 使用KV存储替代内存存储
        await kv.set(id, html);
        console.log(`Saved HTML content with ID: ${id}`);
        
        const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://${req.get('host')}`;
        res.json({ 
            id,
            url: `${host}/view/${id}`
        });
    } catch (error) {
        console.error('Error saving HTML:', error);
        res.status(500).json({ error: '保存失败，请稍后重试' });
    }
});

// 获取HTML内容
app.get('/api/html/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // 从KV存储中获取数据
        const html = await kv.get(id);
        
        if (!html) {
            return res.status(404).json({ error: '未找到对应的HTML内容' });
        }
        
        res.json({ html });
    } catch (error) {
        console.error('Error fetching HTML:', error);
        res.status(500).json({ error: '获取内容失败，请稍后重试' });
    }
});

// 渲染HTML页面
app.get('/view/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // 从KV存储中获取数据
        const html = await kv.get(id);
        
        if (!html) {
            return res.status(404).send('页面未找到');
        }
        
        res.send(html);
    } catch (error) {
        console.error('Error rendering HTML:', error);
        res.status(500).send('服务器错误，请稍后重试');
    }
});

// 健康检查接口
app.get('/api/health', async (req, res) => {
    const isConnected = await checkKVConnection();
    if (isConnected) {
        res.json({ status: 'healthy' });
    } else {
        res.status(500).json({ status: 'unhealthy', error: 'KV connection failed' });
    }
});

module.exports = app; 