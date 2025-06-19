const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const port = 3001;

// 使用内存存储HTML内容
const htmlStore = new Map();

app.use(cors());
app.use(express.json());

// 保存HTML内容并生成唯一ID
app.post('/api/save', (req, res) => {
    const { html } = req.body;
    if (!html) {
        return res.status(400).json({ error: '需要提供HTML内容' });
    }

    const id = nanoid(10);
    htmlStore.set(id, html);
    
    res.json({ 
        id,
        url: `${req.protocol}://${req.get('host')}/view/${id}`
    });
});

// 获取HTML内容
app.get('/api/html/:id', (req, res) => {
    const { id } = req.params;
    const html = htmlStore.get(id);
    
    if (!html) {
        return res.status(404).json({ error: '未找到对应的HTML内容' });
    }
    
    res.json({ html });
});

// 渲染HTML页面
app.get('/view/:id', (req, res) => {
    const { id } = req.params;
    const html = htmlStore.get(id);
    
    if (!html) {
        return res.status(404).send('页面未找到');
    }
    
    res.send(html);
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 