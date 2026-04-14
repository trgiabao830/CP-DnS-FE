import { useState } from "react";
import { clientAuthService } from "../../services/client/auth.service";
import type { LoginRequest, RegisterRequest } from "../../types/client/auth";
import { useAuthModal } from "../../context/client/AuthModalContext";

export const useClientAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { closeModal } = useAuthModal();

  const handleLogin = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await clientAuthService.login(data);
      localStorage.setItem("clientUser", JSON.stringify(user));
      closeModal();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await clientAuthService.register(data);
      return true;
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleLogin,
    handleRegister,
  };
};
