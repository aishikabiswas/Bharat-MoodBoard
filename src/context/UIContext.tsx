import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastType } from '../components/Toast';
import { CustomAlert } from '../components/CustomAlert';

interface UIContextType {
    showToast: (message: string, type?: ToastType) => void;
    showAlert: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    hideAlert: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Toast State
    const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false,
    });

    // Alert State
    const [alert, setAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type, visible: true });
    };

    const hideToast = () => {
        setToast((prev) => ({ ...prev, visible: false }));
    };

    const showAlert = (
        title: string,
        message: string,
        onConfirm: () => void,
        confirmText?: string,
        cancelText?: string
    ) => {
        setAlert({
            visible: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                hideAlert();
            },
            confirmText,
            cancelText,
        });
    };

    const hideAlert = () => {
        setAlert((prev) => ({ ...prev, visible: false }));
    };

    return (
        <UIContext.Provider value={{ showToast, showAlert, hideAlert }}>
            {children}
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
            />
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                onConfirm={alert.onConfirm}
                onCancel={hideAlert}
                confirmText={alert.confirmText}
                cancelText={alert.cancelText}
            />
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
