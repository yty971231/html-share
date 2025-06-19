import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  const [html, setHtml] = useState('');
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' 或 'preview'
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 当HTML内容改变时，自动生成分享链接
  useEffect(() => {
    const generateShareLink = async () => {
      if (!html.trim()) {
        setShareUrl('');
        return;
      }

      // 简单验证是否包含HTML标签
      if (!/<[^>]*>/i.test(html)) {
        setShareUrl('');
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ html }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setShareUrl(window.location.origin + '/view/' + data.id);
        } else {
          console.error('生成链接失败');
          setShareUrl('');
        }
      } catch (err) {
        console.error('网络错误:', err);
        setShareUrl('');
      } finally {
        setIsLoading(false);
      }
    };

    // 使用防抖，避免频繁请求
    const timeoutId = setTimeout(generateShareLink, 1000);
    return () => clearTimeout(timeoutId);
  }, [html]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>HTML 在线渲染和分享工具</h1>
        <div className="tab-container">
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
      </header>

      <main className="app-main">
        {activeTab === 'preview' && (
          <div className="share-url-container">
            {isLoading ? (
              <span className="loading">生成分享链接中...</span>
            ) : shareUrl ? (
              <div className="share-url">
                分享链接：
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  {shareUrl}
                </a>
                <button 
                  className="copy-button"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                >
                  复制链接
                </button>
              </div>
            ) : (
              <span className="no-share">请输入有效的 HTML 代码以生成分享链接</span>
            )}
          </div>
        )}
        
        <div className="content-container">
          {activeTab === 'edit' ? (
            <div className="editor-container">
              <textarea
                className="html-editor"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder="在此输入 HTML 代码..."
              />
            </div>
          ) : (
            <div className="preview-container">
              <iframe
                className="preview-frame"
                srcDoc={html}
                title="HTML Preview"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
