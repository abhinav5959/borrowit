import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import Login from './pages/Login';
import Home from './pages/Home';
import MyRequests from './pages/MyRequests';
import Profile from './pages/Profile';
import NotificationListener from './components/NotificationListener';
import './styles/global.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>Loading...</div>;

  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationListener />
      <LocationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            <Route path="/my-requests" element={
              <PrivateRoute>
                <MyRequests />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
