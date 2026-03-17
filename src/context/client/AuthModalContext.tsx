import React, { createContext, useContext, useState, type ReactNode } from "react";
import AuthModal from "../../components/client/auth/AuthModal";

type ModalView = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

interface AuthModalContextType {
  isOpen: boolean;
  view: ModalView;
  openModal: (view?: ModalView) => void;
  closeModal: () => void;
  switchView: (view: ModalView) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ModalView>("LOGIN");

  const openModal = (initialView: ModalView = "LOGIN") => {
    setView(initialView);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);
  const switchView = (newView: ModalView) => setView(newView);

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openModal, closeModal, switchView }}>
      {children}
      <AuthModal />
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error("useAuthModal must be used within AuthModalProvider");
  return context;
};