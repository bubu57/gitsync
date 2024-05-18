import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RepoDetail from './pages/RepoDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/repos/:name" component={<RepoDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;