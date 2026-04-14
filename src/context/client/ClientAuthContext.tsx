import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { userService } from "../../services/client/user.service";
import { clientAuthService } from "../../services/client/auth.service";
interface ClientAuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const ClientAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("clientUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      try {
        const profile = await userService.getMyProfile();
        setUser(profile);
        localStorage.setItem("clientUser", JSON.stringify(profile));
      } catch (error) {
        console.log("Client session expired");
        localStorage.removeItem("clientUser");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: any) => {
    setUser(userData);
    localStorage.setItem("clientUser", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await clientAuthService.logout();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      localStorage.removeItem("clientUser");
      window.location.href = "/";
    }
  };

  return (
    <ClientAuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) throw new Error("useClientAuth must be used within ClientAuthProvider");
  return context;
};