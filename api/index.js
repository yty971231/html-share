const express = require('express');
const { createClient } = require('redis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 创建 Redis 客户端
const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      console.log(`Redis 重连尝试次数: ${retries}`);
      return Math.min(retries * 100, 3000);
    }
  }
});

redis.on('error', err => {
  console.error('Redis 客户端错误:', err);
  console.error('Redis URL:', process.env.REDIS_URL ? '已设置' : '未设置');
});

redis.on('connect', () => {
  console.log('Redis 连接成功');
});

redis.on('reconnecting', () => {
  console.log('Redis 正在重新连接...');
});

// 连接到 Redis
redis.connect().catch(err => {
  console.error('Redis 连接错误:', err);
  console.error('环境变量:', {
    REDIS_URL: process.env.REDIS_URL ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV
  });
});

// 测试 Redis 连接
app.get('/api/test', async (req, res) => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    await redis.set('test', 'connection successful');
    const value = await redis.get('test');
    console.log('Redis 测试成功:', value);
    res.json({ status: 'success', message: value });
  } catch (error) {
    console.error('Redis 测试错误:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      details: {
        isConnected: redis.isOpen,
        hasRedisUrl: Boolean(process.env.REDIS_URL)
      }
    });
  }
});

// 保存 HTML 内容
app.post('/api/save', async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ status: 'error', message: 'HTML content is required' });
    }
    
    if (html.length > 1000000) { // 1MB 限制
      return res.status(400).json({ status: 'error', message: 'Content too large' });
    }

    if (!redis.isOpen) {
      await redis.connect();
    }

    const id = Math.random().toString(36).substring(2, 15);
    await redis.set(id, html, {
      EX: 60 * 60 * 24 * 7 // 7天过期
    });

    res.json({ status: 'success', id });
  } catch (error) {
    console.error('保存内容错误:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 获取 HTML 内容
app.get('/api/load/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!redis.isOpen) {
      await redis.connect();
    }

    const html = await redis.get(id);
    if (!html) {
      return res.status(404).json({ status: 'error', message: 'Content not found' });
    }

    res.json({ status: 'success', html });
  } catch (error) {
    console.error('加载内容错误:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 本地开发服务器
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  });
}

module.exports = app; 
