import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>HTML 在线渲染和分享工具</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<div>欢迎使用 HTML 分享工具</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
