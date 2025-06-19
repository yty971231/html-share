const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const { kv } = require('@vercel/kv');

const app = express();

app.use(cors());
app.use(express.json());

// 保存HTML内容并生成唯一ID
app.post('/api/save', async (req, res) => {
    const { html } = req.body;
    if (!html) {
        return res.status(400).json({ error: '需要提供HTML内容' });
    }

    const id = nanoid(10);
    // 使用KV存储替代内存存储
    await kv.set(id, html);
    
    const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://${req.get('host')}`;
    res.json({ 
        id,
        url: `${host}/view/${id}`
    });
});

// 获取HTML内容
app.get('/api/html/:id', async (req, res) => {
    const { id } = req.params;
    // 从KV存储中获取数据
    const html = await kv.get(id);
    
    if (!html) {
        return res.status(404).json({ error: '未找到对应的HTML内容' });
    }
    
    res.json({ html });
});

// 渲染HTML页面
app.get('/view/:id', async (req, res) => {
    const { id } = req.params;
    // 从KV存储中获取数据
    const html = await kv.get(id);
    
    if (!html) {
        return res.status(404).send('页面未找到');
    }
    
    res.send(html);
});

module.exports = app; 