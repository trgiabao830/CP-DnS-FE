import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { AuthResponse, LoginRequest } from "../../types/admin/auth";
import { authService } from "../../services/admin/auth.service";

interface AuthContextType {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPermissionsUpdating: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: (errorMessage?: string) => void;
  triggerRefreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPermissionsUpdating, setIsPermissionsUpdating] =
    useState<boolean>(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const logout = useCallback(
    (errorMessage?: string) => {
      authService.logout();
      localStorage.removeItem("currentUser");
      setUser(null);

      navigate("/admin/login", {
        state: {
          errorMessage: errorMessage || null,
        },
      });
    },
    [navigate],
  );

  useEffect(() => {
    const initAuth = async () => {
      
      const isAdminRoute = location.pathname.startsWith("/admin");
      
      if (!isAdminRoute) {
        setIsLoading(false);
        return;
      }

      const storedUser = localStorage.getItem("currentUser");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          const latestUser = await authService.checkSession();

          setUser(latestUser);
        } catch (error: any) {
          console.warn("Lỗi xác thực phiên đăng nhập:", error);

          if (error.status === 401 || error.status === 403) {
            console.log("Phiên hết hạn, đang đăng xuất...");
            logout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          }
        }
      } else {
      }

      setIsLoading(false);
    };

    initAuth();
  }, [logout, location.pathname]);

  const login = async (credentials: LoginRequest) => {
    const data = await authService.login(credentials);
    setUser(data);
    localStorage.setItem("currentUser", JSON.stringify(data));
    navigate("/admin");
  };

  const triggerRefreshPermissions = useCallback(async () => {
    setIsPermissionsUpdating(true);

    try {
      console.log("🔄 Đang đồng bộ lại quyền hạn...");
      const updatedUser = await authService.refreshPermissions();

      setUser((prev) => {
        if (!prev) return null;
        return { ...prev, ...updatedUser };
      });

      const storedData = localStorage.getItem("currentUser");
      const prevLocalUser = storedData ? JSON.parse(storedData) : {};
      const mergedLocalUser = { ...prevLocalUser, ...updatedUser };

      localStorage.setItem("currentUser", JSON.stringify(mergedLocalUser));
      console.log("✅ Đã cập nhật quyền thành công! Đang tải lại trang...");

      window.location.reload();
    } catch (error: any) {
      console.error("Lỗi khi cập nhật quyền:", error);

      if (
        error.message === "UNAUTHORIZED" ||
        error.message?.includes("401") ||
        error.message?.includes("403")
      ) {
        logout("Tài khoản của bạn đã bị khóa hoặc thay đổi phân quyền.");
      } else {
        setTimeout(() => {
          setIsPermissionsUpdating(false);
        }, 500);
      }
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isPermissionsUpdating,
        triggerRefreshPermissions,
      }}
    >

      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};