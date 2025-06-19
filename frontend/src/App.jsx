import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  const [html, setHtml] = useState('');
  const [preview, setPreview] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>HTML 在线渲染和分享工具</h1>
          <div className="header-buttons">
            <button 
              className={`tab-button ${!preview ? 'active' : ''}`}
              onClick={() => setPreview(false)}
            >
              编辑代码
            </button>
            <button 
              className={`tab-button ${preview ? 'active' : ''}`}
              onClick={() => setPreview(true)}
            >
              预览效果
            </button>
          </div>
        </header>

        <main className="app-main">
          {!preview ? (
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
        </main>
      </div>
    </Router>
  );
}

export default App;
