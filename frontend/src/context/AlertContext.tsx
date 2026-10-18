import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react-native';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextData {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<AlertOptions | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const showAlert = (options: AlertOptions) => {
    let title = options.title;
    let message = options.message;
    let type = options.type || 'info';

    const lowerMessage = (message || '').toLowerCase();
    const isNetworkError = 
      lowerMessage.includes('server connection') ||
      lowerMessage.includes('network request failed') ||
      lowerMessage.includes('failed to fetch') ||
      lowerMessage.includes('network error') ||
      lowerMessage.includes('connection failed') ||
      lowerMessage.includes('check connection');

    if (isNetworkError) {
      title = "Connection Failed";
      message = "Internet is not working or server is unreachable. Please check your data/Wi-Fi connection and try again.";
      type = "error";
    }

    setAlertData({
      confirmText: 'OK',
      cancelText: 'Cancel',
      ...options,
      title,
      message,
      type
    });
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideAlert = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setAlertData(null);
    });
  };

  const handleConfirm = () => {
    if (alertData?.onConfirm) {
      alertData.onConfirm();
    }
    hideAlert();
  };

  const handleCancel = () => {
    if (alertData?.onCancel) {
      alertData.onCancel();
    }
    hideAlert();
  };

  const getIconAndColor = (type: AlertType = 'info') => {
    switch (type) {
      case 'success': return { icon: <CheckCircle2 color="#10B981" width={32} height={32} />, color: '#10B981', bg: '#D1FAE5' };
      case 'error': return { icon: <AlertCircle color="#EF4444" width={32} height={32} />, color: '#EF4444', bg: '#FEE2E2' };
      case 'warning': return { icon: <AlertTriangle color="#F59E0B" width={32} height={32} />, color: '#F59E0B', bg: '#FEF3C7' };
      default: return { icon: <Info color="#3B82F6" width={32} height={32} />, color: '#3B82F6', bg: '#DBEAFE' };
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
        <View style={styles.overlay}>
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
            {alertData && (
              <>
                <View style={[styles.iconContainer, { backgroundColor: getIconAndColor(alertData.type).bg }]}>
                  {getIconAndColor(alertData.type).icon}
                </View>
                <Text style={styles.title}>{alertData.title}</Text>
                <Text style={styles.message}>{alertData.message}</Text>

                <View style={styles.buttonRow}>
                  {alertData.showCancel && (
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} activeOpacity={0.8}>
                      <Text style={styles.cancelButtonText}>{alertData.cancelText}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.button, { backgroundColor: getIconAndColor(alertData.type).color }]} 
                    onPress={handleConfirm} 
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>{alertData.confirmText}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
  },
});
