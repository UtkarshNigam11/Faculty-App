import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CompleteRegistration from './pages/CompleteRegistration';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/complete-registration" element={<CompleteRegistration />} />
      </Routes>
    </Router>
  );
}

export default App;
