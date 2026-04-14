import React, { createContext, useContext, useState, type ReactNode } from "react";
import { ErrorModal } from "../../components/admin/common/ActionModals";
import { useAuth } from "./AuthContext";

interface GlobalErrorContextType {
  showError: (error: any) => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | undefined>(undefined);

export const GlobalErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errorMsg, setErrorMsg] = useState("");
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const { logout } = useAuth();

  const showError = (error: any) => {
    console.error("Global Error Catch:", error);
    
    const status = error?.status || error?.response?.status;
    const message = error?.response?.data?.message || error?.message || "Có lỗi xảy ra";

    setErrorCode(status);
    setErrorMsg(message);
  };

  const handleClose = () => {
    if (errorCode === 401) {
      logout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    setErrorMsg("");
    setErrorCode(null);
  };

  return (
    <GlobalErrorContext.Provider value={{ showError }}>
      {children}
      
      <ErrorModal 
        message={errorMsg} 
        onClose={handleClose} 
      />
    </GlobalErrorContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalError = () => {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error("useGlobalError must be used within a GlobalErrorProvider");
  }
  return context;
};