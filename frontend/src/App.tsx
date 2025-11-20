import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DIContainer } from './di/container';
import { Landing } from './ui/pages/Landing';
import { Room } from './ui/pages/Room';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <DIContainer>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </DIContainer>
    </BrowserRouter>
  );
};

export default App;

