import { useState } from 'react'
import './App.css'

// 获取API基础URL
const API_BASE = import.meta.env.PROD 
  ? '' // 生产环境使用相对路径
  : 'http://localhost:3001' // 开发环境使用本地服务器

function App() {
  const [html, setHtml] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('edit') // 'edit' 或 'preview'

  const handleShare = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html }),
      })
      const data = await response.json()
      if (response.ok) {
        setShareUrl(data.url)
        setError('')
        // 生成链接后自动切换到预览标签
        setActiveTab('preview')
      } else {
        setError(data.error || '保存失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  return (
    <div className="container">
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          编辑代码
        </button>
        <button 
          className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          预览效果
        </button>
      </div>

      <div className="content-container">
        {activeTab === 'edit' ? (
          <div className="edit-container">
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="在此输入HTML代码..."
              className="html-input"
            />
            <div className="button-container">
              <button onClick={handleShare} className="share-button">
                生成分享链接
              </button>
              <button 
                onClick={() => setActiveTab('preview')} 
                className="preview-button"
              >
                查看预览 →
              </button>
            </div>
            {error && <div className="error">{error}</div>}
            {shareUrl && (
              <div className="share-url">
                分享链接：
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  {shareUrl}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-container">
            <iframe
              srcDoc={html}
              title="HTML Preview"
              className="preview-frame"
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
