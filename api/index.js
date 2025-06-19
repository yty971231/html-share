const express = require('express');
const cors = require('cors');
const Redis = require('redis');
const { promisify } = require('util');

const app = express();
app.use(cors());
app.use(express.json());

// Redis 客户端配置
const client = Redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis Client Connected'));

// 健康检查接口
app.get('/api/health', async (req, res) => {
  try {
    await client.connect();
    res.json({ status: 'success', message: 'connection successful' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 导出 Express 应用
module.exports = app;
