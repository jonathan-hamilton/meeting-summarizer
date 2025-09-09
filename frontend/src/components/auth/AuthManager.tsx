import React, { useState } from 'react';
import { LoginDialog } from './LoginDialog';
import { RegisterDialog } from './RegisterDialog';

interface AuthManagerProps {
  loginOpen: boolean;
  registerOpen: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onSwitchToLogin?: () => void;
  onSwitchToRegister?: () => void;
}

export const AuthManager: React.FC<AuthManagerProps> = ({
  loginOpen,
  registerOpen,
  onCloseLogin,
  onCloseRegister,
  onSwitchToLogin,
  onSwitchToRegister
}) => {
  const [currentDialog, setCurrentDialog] = useState<'login' | 'register' | null>(null);

  React.useEffect(() => {
    if (loginOpen) {
      setCurrentDialog('login');
    } else if (registerOpen) {
      setCurrentDialog('register');
    } else {
      setCurrentDialog(null);
    }
  }, [loginOpen, registerOpen]);

  const handleSwitchToRegister = () => {
    setCurrentDialog('register');
    onSwitchToRegister?.();
  };

  const handleSwitchToLogin = () => {
    setCurrentDialog('login');
    onSwitchToLogin?.();
  };

  const handleCloseLogin = () => {
    setCurrentDialog(null);
    onCloseLogin();
  };

  const handleCloseRegister = () => {
    setCurrentDialog(null);
    onCloseRegister();
  };

  return (
    <>
      <LoginDialog
        open={currentDialog === 'login'}
        onClose={handleCloseLogin}
        onSwitchToRegister={handleSwitchToRegister}
      />
      
      <RegisterDialog
        open={currentDialog === 'register'}
        onClose={handleCloseRegister}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
};
