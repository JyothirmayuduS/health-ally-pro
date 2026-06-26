import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function getNotificationsModule() {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

try {
  const Notifications = getNotificationsModule();
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  console.warn("[Notifications] Native module unavailable (Expo Go)");
}

export const checkNotificationPermission = async () => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return true;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    return existingStatus === 'granted';
  } catch {
    return true;
  }
};

export const requestNotificationPermission = async () => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return true;

  try {
    const { status } = await Notifications.requestPermissionsAsync();

    if (status === 'granted' && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#B6785C',
      });
      await Notifications.setNotificationChannelAsync('rx-alerts', {
        name: 'Prescription alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 180, 100, 180],
        lightColor: '#2C7873',
      });
    }

    return status === 'granted';
  } catch {
    return true;
  }
};

export const scheduleTestNotification = async () => {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    console.log("[Mock Notification] Medora Live synchronization 📡");
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Medora Live synchronization 📡",
        body: "Notifications are now active. You'll receive live updates for your queue, prescriptions, and medication reminders.",
        data: { type: 'test' },
      },
      trigger: { seconds: 2 },
    });
  } catch (e) {
    console.error("[Notifications] Scheduling failed:", e);
  }
};

export async function notifyNewPrescription(input: {
  rxNumber: string;
  doctorName: string;
  diagnosis: string;
}) {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    console.log(`[Mock Rx Push] ${input.rxNumber} from ${input.doctorName}`);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "New e-prescription",
        body: `${input.doctorName} sent ${input.rxNumber}. ${input.diagnosis}`,
        data: { type: 'rx', rxNumber: input.rxNumber },
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.error("[Notifications] Rx alert failed:", e);
  }
}
