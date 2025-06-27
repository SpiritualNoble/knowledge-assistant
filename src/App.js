import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import UnifiedChatPage from './pages/UnifiedChatPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import UploadPage from './pages/UploadPage';
import DocumentsPage from './pages/DocumentsPage';
import AboutPage from './pages/AboutPage';
import AuthModal from './components/AuthModal';

function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // 检查本地存储的用户信息
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={
          <Layout 
            user={user} 
            onLogin={() => setShowAuthModal(true)}
            onLogout={handleLogout}
          />
        }>
          {/* 主页改为统一聊天界面 */}
          <Route index element={<UnifiedChatPage user={user} />} />
          <Route path="home" element={<HomePage user={user} />} />
          <Route path="search" element={<SearchPage user={user} />} />
          <Route path="chat" element={<ChatPage user={user} />} />
          <Route path="upload" element={<UploadPage user={user} />} />
          <Route path="documents" element={<DocumentsPage user={user} />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />
    </>
  );
}

export default App;
