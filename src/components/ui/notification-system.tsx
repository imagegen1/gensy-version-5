"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatedList, AnimatedListItem } from '@/components/magicui/animated-list';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 means persistent
  dismissible?: boolean;
  uniqueKey?: string; // Optional unique key to prevent duplicates
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true,
    };

    setNotifications(prev => {
      // If uniqueKey is provided, remove any existing notification with the same uniqueKey
      if (newNotification.uniqueKey) {
        const filtered = prev.filter(n => n.uniqueKey !== newNotification.uniqueKey);
        return [newNotification, ...filtered];
      }
      return [newNotification, ...prev];
    });

    // Auto-remove notification after duration (if not persistent)
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-sm">
      <AnimatedList className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatedList>
    </div>
  );
}

function NotificationItem({ 
  notification, 
  onDismiss 
}: { 
  notification: Notification; 
  onDismiss: () => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'info':
        return 'border-blue-200 dark:border-blue-800';
      case 'warning':
        return 'border-amber-200 dark:border-amber-800';
      case 'success':
        return 'border-green-200 dark:border-green-800';
      case 'error':
        return 'border-red-200 dark:border-red-800';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/20';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/20';
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20';
    }
  };

  return (
    <div className={cn(
      "relative rounded-lg border p-4 shadow-lg backdrop-blur-sm",
      getBorderColor(),
      getBackgroundColor()
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {notification.message}
          </p>
        </div>
        {notification.dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
