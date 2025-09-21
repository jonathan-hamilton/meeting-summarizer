import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '../stores/authStore';

const DebugAuth = () => {

  useEffect(() => {
    console.log('🐛 DEBUG AUTH COMPONENT MOUNTED');
    
    // Check localStorage directly
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userString = localStorage.getItem('user');
    
    console.log('📦 LocalStorage contents:');
    console.log('  accessToken exists:', !!accessToken);
    console.log('  refreshToken exists:', !!refreshToken);
    console.log('  user string:', userString);
    
    if (userString) {
      try {
        const parsedUser = JSON.parse(userString);
        console.log('  parsed user keys:', Object.keys(parsedUser));
        console.log('  parsed user:', parsedUser);
      } catch (e) {
        console.log('  Error parsing user string:', e);
      }
    }
    
    // Check JWT token if it exists
    if (accessToken) {
      try {
        const decoded = jwtDecode(accessToken);
        console.log('🔑 JWT Token contents:');
        console.log('  decoded keys:', Object.keys(decoded));
        console.log('  decoded token:', decoded);
      } catch (e) {
        console.log('  Error decoding JWT:', e);
      }
    }
    
    // Check auth store state
    const authState = useAuthStore.getState();
    console.log('🏪 Auth Store state:');
    console.log('  isAuthenticated:', authState.isAuthenticated);
    console.log('  isLoading:', authState.isLoading);
    console.log('  user:', authState.user);
    console.log('  user keys:', authState.user ? Object.keys(authState.user) : null);
    if (authState.user) {
      console.log('  user.id:', authState.user.id);
      console.log('  user.email:', authState.user.email);
    }
    
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      Debug Auth Active - Check Console
    </div>
  );
};

export default DebugAuth;