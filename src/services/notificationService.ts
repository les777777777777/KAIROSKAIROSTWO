/**
 * Kairos Notification Service
 * Manages local and background PWA notifications, permission states, and schedule timers
 * for a fully-featured, offline-friendly productivity workspace.
 */

export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  time: string; // HH:MM
  days?: string[]; // ['Lun', 'Mar', etc...] or ['Todos']
  completedToday?: boolean;
}

const DAYS_MAP = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

class NotificationServiceManager {
  private notifiedKeys: Set<string> = new Set();
  private lastActivityCheckKey = 'kairos_last_activity_timestamp';

  /**
   * Checks if notification API is supported by the browser
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Requests permission for notifications
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  }

  /**
   * Has permission already been granted?
   */
  public hasPermission(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Triggers an instant notification (using Service Worker when possible for background stability,
   * falling back to standard Notification constructor)
   */
  public async sendNotification(title: string, body: string, icon = '/icon-192.png'): Promise<boolean> {
    if (!this.hasPermission()) {
      // Promptly try to request if we can, otherwise skip
      return false;
    }

    try {
      // Try using Service Worker registration for native-like offline banners
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon,
            badge: '/favicon-32.png',
            vibrate: [200, 100, 200],
            data: {
              url: window.location.origin
            }
          } as any);
          return true;
        }
      }

      // Standard fallback
      new Notification(title, { body, icon });
      return true;
    } catch (err) {
      console.error('Failed to trigger instant local notification:', err);
      try {
        new Notification(title, { body, icon });
        return true;
      } catch (innerErr) {
        return false;
      }
    }
  }

  /**
   * Track user's active session to detect if the app was NOT opened during the day.
   */
  public recordAppOpening() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.lastActivityCheckKey, Date.now().toString());
    }
  }

  /**
   * Runs checks for scheduled items (Alarms, Habits, Routines) and fires notifications if matches are found.
   * Call this every minute on a background cycle or clock tick.
   */
  public checkSchedules(items: {
    alarms: Array<{ id: string; title: string; time: string; days: string[]; enabled: boolean; category: string }>;
    routine: Array<{ id: string; activity: string; time: string; completed: boolean }>;
    wellness: Array<{ id: string; label: string; time: string; completed: boolean }>;
    streak: number;
    mascotName: string;
  }) {
    if (!this.hasPermission()) return;

    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMinute = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    const todayDayName = DAYS_MAP[now.getDay()];
    const todayDateStr = now.toDateString();

    const checkAndNotify = async (key: string, title: string, message: string) => {
      const compositeKey = `${key}_${todayDateStr}_${currentTimeStr}`;
      if (this.notifiedKeys.has(compositeKey)) return;

      this.notifiedKeys.add(compositeKey);
      await this.sendNotification(title, message);
    };

    // 1. Process active alarms
    items.alarms.forEach(alarm => {
      if (!alarm.enabled) return;
      if (alarm.time === currentTimeStr) {
        // Alarms are active either for 'Todos' or if the current day name is in days array
        const isActiveToday = alarm.days.includes('Todos') || alarm.days.includes(todayDayName);
        if (isActiveToday) {
          const catLabel = alarm.category === 'meal' ? 'Alimento 🍏' : alarm.category === 'medicine' ? 'Cuidado 💊' : 'Enfoque ⚡';
          checkAndNotify(
            `alarm_${alarm.id}`,
            `Alarma: ${alarm.title || 'Kairos Alerta'}`,
            `¡Es hora del ritmo de tu día! Categoria: ${catLabel}`
          );
        }
      }
    });

    // 2. Process routines
    items.routine.forEach(item => {
      if (item.completed) return;
      if (item.time === currentTimeStr) {
        checkAndNotify(
          `routine_${item.id}`,
          `Rutina de hoy: ${item.activity}`,
          `Sintoniza con tu rutina planificada para este momento.`
        );
      }
    });

    // 3. Process wellness habits
    items.wellness.forEach(habit => {
      if (habit.completed) return;
      // Wellness habits has time too
      if (habit.time === currentTimeStr) {
        checkAndNotify(
          `wellness_${habit.id}`,
          `Bienestar: ${habit.label}`,
          `Completa tu hábito para cuidar de ti y de tu mascota ${items.mascotName} 🐾`
        );
      }
    });

    // 4. Streak preservation warnings
    // At 20:00, if they haven't completed anything, warn them so they won't lose the streak!
    if (currentHour === '20' && currentMinute === '00') {
      const anyCompleted = items.routine.some(r => r.completed) || 
                           items.wellness.some(w => w.completed);
      if (!anyCompleted && items.streak > 0) {
        checkAndNotify(
          'streak_warning_20_00',
          `No pierdas tu racha de hoy 🔥`,
          `Tu mascota ${items.mascotName} te está esperando 🐾 Completa una actividad de hoy.`
        );
      }
    }

    // 5. Mascot feed/wellness warning
    // At 14:00, if mascot lacks attention
    if (currentHour === '14' && currentMinute === '00') {
      const totalActivities = items.routine.length + items.wellness.length;
      const completedCount = items.routine.filter(r => r.completed).length + 
                             items.wellness.filter(w => w.completed).length;
      if (completedCount === 0 && totalActivities > 0) {
        checkAndNotify(
          'mascot_warning_14_00',
          `Tu mascota te está esperando 🐾`,
          `Completa un hábito para seguir creciendo juntos en armonía.`
        );
      }
    }
  }

  /**
   * Triggers a fallback check that is stored locally to verify if they missed opening the app yesterday.
   */
  public async getOfflineWarningStatus(): Promise<string | null> {
    if (typeof localStorage === 'undefined') return null;
    const lastStr = localStorage.getItem(this.lastActivityCheckKey);
    if (!lastStr) return null;

    const lastTime = parseInt(lastStr, 10);
    const diffMs = Date.now() - lastTime;
    const hours = diffMs / (1000 * 60 * 60);

    if (hours >= 24 && hours < 48) {
      return '¡Tu mascota te extraña! No dejes tu racha de lado, sintoniza tu sintonía diaria ✨';
    }
    return null;
  }
}

export const NotificationService = new NotificationServiceManager();
