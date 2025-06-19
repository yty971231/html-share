const express = require('express');
const cors = require('cors');
const Redis = require('redis');

const app = express();
app.use(cors());
app.use(express.json());

// Redis 客户端配置
const client = Redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Redis Client Error:', err));

// 保存 HTML 内容
app.post('/api/save', async (req, res) => {
  try {
    await client.connect();
    const { html } = req.body;
    
    if (!html) {
      return res.status(400).json({ error: '请提供 HTML 内容' });
    }

    // 生成唯一ID
    const id = Math.random().toString(36).substring(2, 15);
    
    // 存储到 Redis，设置7天过期
    await client.set(`html:${id}`, html);
    await client.expire(`html:${id}`, 60 * 60 * 24 * 7);

    res.json({ id });
  } catch (error) {
    console.error('保存失败:', error);
    res.status(500).json({ error: '保存失败' });
  } finally {
    await client.disconnect();
  }
});

// 获取 HTML 内容
app.get('/api/html/:id', async (req, res) => {
  try {
    await client.connect();
    const { id } = req.params;
    const html = await client.get(`html:${id}`);
    
    if (!html) {
      return res.status(404).json({ error: '内容不存在或已过期' });
    }

    res.json({ html });
  } catch (error) {
    console.error('获取失败:', error);
    res.status(500).json({ error: '获取失败' });
  } finally {
    await client.disconnect();
  }
});

// 查看页面路由 - 直接返回完整的 HTML 页面
app.get('/view/:id', async (req, res) => {
  try {
    await client.connect();
    const { id } = req.params;
    const html = await client.get(`html:${id}`);
    
    if (!html) {
      return res.status(404).send('内容不存在或已过期');
    }

    // 直接返回用户的 HTML 内容
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HTML 预览</title>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
  } catch (error) {
    console.error('获取失败:', error);
    res.status(500).send('服务器错误');
  } finally {
    await client.disconnect();
  }
});

module.exports = app;
