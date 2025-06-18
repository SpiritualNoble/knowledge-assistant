import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import UploadPage from './pages/UploadPage';
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}

export default App;
