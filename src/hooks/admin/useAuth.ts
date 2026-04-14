import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/admin/auth.service.ts';
import type { LoginRequest } from '../../types/admin/auth.ts';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const login = async (credentials: LoginRequest) => {
     try {
        const data = await authService.login(credentials);
        navigate('/');
     } catch (err) {
     } finally {
        setIsLoading(false);
     }
  };

  const logoutUser = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      navigate('/login'); 
    } catch (error) {
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    login, 
    logoutUser,
    isLoading, 
    error, 
    setError 
  };
};