import { useState, useEffect } from 'react'
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
  const [isLoading, setIsLoading] = useState(false)

  // 如果URL中包含view参数，则加载对应的HTML内容
  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/view/')) {
      const id = path.split('/view/')[1]
      fetchHtml(id)
    }
  }, [])

  // 当HTML内容改变时，自动生成分享链接
  useEffect(() => {
    const generateShareLink = async () => {
      if (!html.trim()) {
        setShareUrl('')
        // 当输入为空时，清除之前的错误提示
        setError('') 
        return
      }
      
      try {
        setIsLoading(true)
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
        } else {
          // 使用 data.message 来显示后端返回的具体错误
          console.error('生成链接失败:', data.message)
          setError(data.message || '生成链接失败，请稍后重试。')
        }
      } catch (err) {
        console.error('网络错误:', err)
        setError('网络错误，请检查您的网络连接。')
      } finally {
        setIsLoading(false)
      }
    }

    // 使用防抖，避免频繁请求
    const timeoutId = setTimeout(generateShareLink, 1000)
    return () => clearTimeout(timeoutId)
  }, [html])

  const fetchHtml = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/html/${id}`)
      const data = await response.json()
      if (response.ok) {
        setHtml(data.html)
        setActiveTab('preview')
      } else {
        setError(data.message || '加载失败')
      }
    } catch (err) {
      setError('加载失败，请稍后重试')
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
        {activeTab === 'preview' && shareUrl && !error &&(
          <div className="share-url">
            分享链接：
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              {shareUrl}
            </a>
          </div>
        )}
        
        {/* 在预览模式下，如果出错，也显示错误信息 */}
        {activeTab === 'preview' && error && <div className="error-preview">{error}</div>}

        {isLoading && <div className="loading-indicator">生成链接中...</div>}

        {activeTab === 'edit' ? (
          <div className="edit-container">
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="在此输入HTML代码..."
              className="html-input"
            />
            {error && <div className="error">{error}</div>}
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
