import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Heart, 
  BarChart3,
  Plus,
  Minus,
  Bell,
  User,
  Smartphone,
  Droplets,
  Coffee,
  Moon,
  Zap,
  Check,
  Trash2,
  Pill,
  Utensils,
  AlarmClock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Users,
  Search,
  LogOut,
  Sun,
  Smile,
  Settings,
  Wind,
  Edit2,
  ChevronRight,
  BarChart2,
  HelpCircle,
  FileText,
  TrendingUp,
  Sparkles,
  X,
  Copy,
  ExternalLink,
  MessageSquare,
  Send
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  AreaChart,
  Area,
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Task, AppUsage, LocationTime, RoutineItem, WellnessReminder, CalendarEvent, Alarm, Category } from './types';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { getDocs, deleteDoc, doc, collection, query, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { SocialService, UserProfile, subscribeToQuotaStatus, isQuotaExceededSync, isQuotaError, triggerQuotaExceeded } from './services/socialService';
import { FriendsView } from './components/FriendsView';
import { AuthScreen } from './components/AuthScreen';
import { NotificationService } from './services/notificationService';

// Mock Data
const DEFAULT_TASK_CATEGORIES: Category[] = [
  { id: 'work', name: 'Trabajo', icon: 'briefcase', color: 'indigo' },
  { id: 'study', name: 'Estudio', icon: 'book', color: 'amber' },
  { id: 'personal', name: 'Personal', icon: 'user', color: 'emerald' },
  { id: 'wellness', name: 'Bienestar', icon: 'heart', color: 'rose' },
];

const DEFAULT_EVENT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Trabajo', icon: 'briefcase', color: 'indigo' },
  { id: 'study', name: 'Estudio', icon: 'book', color: 'amber' },
  { id: 'personal', name: 'Personal', icon: 'user', color: 'emerald' },
  { id: 'wellness', name: 'Bienestar', icon: 'heart', color: 'rose' },
];

const DEFAULT_ROUTINE_CATEGORIES: Category[] = [
  { id: 'work', name: 'Trabajo', icon: 'briefcase', color: 'indigo' },
  { id: 'study', name: 'Estudio', icon: 'book', color: 'amber' },
  { id: 'exercise', name: 'Ejercicio', icon: 'zap', color: 'emerald' },
  { id: 'rest', name: 'Descanso', icon: 'coffee', color: 'slate' },
];

const DEFAULT_LOCATION_CATEGORIES: Category[] = [
  { id: 'home', name: 'Hogar', icon: 'home', color: 'indigo' },
  { id: 'work', name: 'Trabajo', icon: 'briefcase', color: 'slate' },
  { id: 'study', name: 'Estudio', icon: 'book', color: 'amber' },
  { id: 'leisure', name: 'Ocio', icon: 'zap', color: 'emerald' },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'meal', name: 'Comida', icon: 'utensils', color: 'orange' },
  { id: 'medicine', name: 'Medicina', icon: 'pill', color: 'blue' },
  { id: 'water', name: 'Agua', icon: 'droplets', color: 'cyan' },
  { id: 'rest', name: 'Descanso', icon: 'coffee', color: 'purple' },
  { id: 'other', name: 'Otro', icon: 'bell', color: 'slate' },
];

const MOCK_ALARMS: Alarm[] = [
  { id: '1', title: 'Desayuno', time: '08:00', category: 'meal', enabled: true, days: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'] },
  { id: '2', title: 'Vitamina C', time: '09:30', category: 'medicine', enabled: true, days: ['Todos'] },
  { id: '3', title: 'Almuerzo', time: '13:30', category: 'meal', enabled: true, days: ['Todos'] },
  { id: '4', title: 'Pausa Activa', time: '16:00', category: 'rest', enabled: false, days: ['Lun', 'Mie', 'Vie'] },
  { id: '5', title: 'Cena', time: '20:00', category: 'meal', enabled: true, days: ['Todos'] },
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Reunión de Equipo', startTime: '09:00', endTime: '10:00', location: 'Zoom', type: 'work', completed: false },
  { id: '2', title: 'Clase de Diseño', startTime: '11:00', endTime: '13:00', location: 'Aula 402', type: 'study', completed: true },
  { id: '3', title: 'Almuerzo con Amigos', startTime: '14:00', endTime: '15:30', location: 'Restaurante Central', type: 'personal', completed: false },
  { id: '4', title: 'Yoga Flow', startTime: '17:00', endTime: '18:00', location: 'Gimnasio', type: 'wellness', completed: false },
  { id: '5', title: 'Lectura Técnica', startTime: '20:00', endTime: '21:00', type: 'study', completed: false },
];

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Terminar proyecto de React', completed: false, category: 'work' },
  { id: '2', title: 'Estudiar para examen de cálculo', completed: true, category: 'study' },
  { id: '3', title: 'Comprar víveres', completed: false, category: 'personal' },
  { id: '4', title: 'Meditación 10 min', completed: false, category: 'wellness' },
];

const MOCK_STATS = [
  { day: 'Lun', value: 40 },
  { day: 'Mar', value: 65 },
  { day: 'Mié', value: 45 },
  { day: 'Jue', value: 80 },
  { day: 'Vie', value: 55 },
  { day: 'Sáb', value: 90 },
  { day: 'Dom', value: 70 },
];

const MOCK_APP_USAGE: AppUsage[] = [
  { name: 'Instagram', time: 45, icon: '📱' },
  { name: 'WhatsApp', time: 30, icon: '💬' },
  { name: 'YouTube', time: 60, icon: '📺' },
  { name: 'Kairos', time: 15, icon: '✨' },
];

const MOCK_LOCATION: LocationTime[] = [
  { id: '1', name: 'Casa', time: 12, category: 'home' },
  { id: '2', name: 'Universidad', time: 6, category: 'study' },
  { id: '3', name: 'Gimnasio', time: 1.5, category: 'leisure' },
  { id: '4', name: 'Trabajo', time: 4.5, category: 'work' },
];

const MOCK_ROUTINE: RoutineItem[] = [
  { id: '1', time: '07:00', activity: 'Despertar & Agua', type: 'rest', completed: true },
  { id: '2', time: '08:30', activity: 'Sesión de Estudio', type: 'study', completed: true },
  { id: '3', time: '12:00', activity: 'Almuerzo Saludable', type: 'rest', completed: false },
  { id: '4', time: '15:00', activity: 'Gimnasio', type: 'exercise', completed: false },
  { id: '5', time: '18:00', activity: 'Trabajo en Proyecto', type: 'work', completed: false },
];

const MOCK_WELLNESS: WellnessReminder[] = [
  { id: '1', type: 'water', label: 'Beber agua', time: '10:00', completed: true },
  { id: '2', type: 'rest', label: 'Descanso visual', time: '11:30', completed: false },
  { id: '3', type: 'food', label: 'Almuerzo saludable', time: '13:00', completed: false },
  { id: '4', type: 'sleep', label: 'Preparar sueño', time: '22:00', completed: false },
  { id: '5', type: 'medicine', label: 'Vitamina C', time: '09:00', completed: false },
  { id: '6', type: 'water', label: 'Hidratación tarde', time: '16:00', completed: false },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'Recordatorio de Agua', message: 'Es hora de beber un vaso de agua.', time: 'Hace 5 min', read: false },
  { id: '2', title: 'Nueva Tarea', message: 'Has añadido "Terminar proyecto" a tu lista.', time: 'Hace 1 hora', read: true },
  { id: '3', title: 'Logro Desbloqueado', message: '¡Has completado todas tus tareas de hoy!', time: 'Hace 2 horas', read: true },
];

import { TimeMascot } from './components/TimeMascot';
import { AIService, UserSnapshot, AIQueryType } from './services/aiService';

const MiniKairoIcon: React.FC<{ balance: number }> = ({ balance }) => {
  const getMoodColor = () => {
    if (balance < 30) return '#4dabf7'; // Soft Blue
    if (balance < 50) return '#adb5bd'; // Soft Grey
    if (balance < 80) return '#fcc419'; // Yellow
    return '#ff6b6b'; // Red-Orange
  };
  const color = getMoodColor();
  const mouthPath = balance < 30 
    ? "M45 65 Q50 55 55 65" 
    : balance < 50 
    ? "M45 60 Q50 60 55 60"
    : "M45 58 Q50 68 55 58";

  return (
    <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-white/10" style={{ backgroundColor: color }}>
      <svg viewBox="0 0 100 100" className="w-6 h-6">
        <circle cx="36" cy="45" r="5" fill="#2d3436" />
        <circle cx="64" cy="45" r="5" fill="#2d3436" />
        <path d={mouthPath} fill="none" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const resolveCustomHabitVisuals = (name: string, isDone: boolean, isDark: boolean) => {
  const normalized = name.toLowerCase().trim();
  let icon = <Bell size={24} />;
  let color = isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500';
  let activeColor = 'bg-slate-500 text-white';

  if (/agua|hidrat|water/.test(normalized)) {
    icon = <Droplets size={24} />;
    color = isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-50 text-sky-500';
    activeColor = 'bg-sky-500 text-white';
  } else if (/comida|comer|almuerz|desayun|cena/.test(normalized)) {
    icon = <Utensils size={24} />;
    color = isDark ? 'bg-slate-800 text-orange-400' : 'bg-orange-50 text-orange-500';
    activeColor = 'bg-orange-500 text-white';
  } else if (/dormir|sueño|descanso|relax|noche/.test(normalized)) {
    icon = <Moon size={24} />;
    color = isDark ? 'bg-slate-800 text-purple-400' : 'bg-purple-50 text-purple-500';
    activeColor = 'bg-purple-500 text-white';
  } else if (/medicina|vitamina|pastilla|pill/.test(normalized)) {
    icon = <Pill size={24} />;
    color = isDark ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-500';
    activeColor = 'bg-indigo-500 text-white';
  } else if (/ejercicio|gym|correr|deporte|entrena/.test(normalized)) {
    icon = <Zap size={24} />;
    color = isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-500';
    activeColor = 'bg-emerald-500 text-white';
  } else if (/meditar|meditación|zen|respira/.test(normalized)) {
    icon = <Sparkles size={24} />;
    color = isDark ? 'bg-slate-800 text-pink-400' : 'bg-pink-50 text-pink-500';
    activeColor = 'bg-pink-500 text-white';
  }

  return {
    icon,
    classes: isDone ? activeColor : `${color} border border-transparent`
  };
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    return subscribeToQuotaStatus(setIsQuotaExceeded);
  }, []);

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('kairos_preferences');
    return saved ? JSON.parse(saved) : {
      darkMode: false,
      pushNotifications: true,
      alarmSound: 'Zen'
    };
  });

  useEffect(() => {
    localStorage.setItem('kairos_preferences', JSON.stringify(preferences));
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences]);

  const [streak, setStreak] = useState(0);
  const [mascotName, setMascotName] = useState('Kairo');
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);

  const [enabledHabitTypes, setEnabledHabitTypes] = useState<WellnessReminder['type'][]>(['water', 'food', 'rest', 'medicine']);
  const [isHabitConfigOpen, setIsHabitConfigOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [wellness, setWellness] = useState<WellnessReminder[]>([]);
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [deletedHabitIds, setDeletedHabitIds] = useState<string[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [progressHistory, setProgressHistory] = useState<{ date: string; value: number }[]>([]);
  const unlockingTitles = useRef<Set<string>>(new Set());

  // Kairo Bot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([
    { sender: 'bot', text: '¡Hola! Soy Kairo, tu guardián y guía personal. ¿En qué puedo ayudarte a sintonizar tu tiempo y bienestar hoy?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateString(d);
  };

  const checkStreakValidity = (profileStreak: number, uid: string) => {
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();
    const lastCompleted = localStorage.getItem(`kairo_last_completed_date_${uid}`);
    
    if (!lastCompleted) {
      // First session or cache cleared, set lastCheckIn to today and return
      localStorage.setItem(`kairo_last_completed_date_${uid}`, todayStr);
      return;
    }
    
    if (lastCompleted !== todayStr && lastCompleted !== yesterdayStr) {
      if (profileStreak > 0) {
        console.log("Streak broken! Resetting to 0 because lastCompleted was:", lastCompleted);
        setStreak(0);
        SocialService.syncProfile({ streak: 0 });
      }
    }
  };

  const markActivityCompletedToday = () => {
    if (!user) return;
    const todayStr = getLocalDateString();
    const yesterdayStr = getYesterdayDateString();
    const lastCompleted = localStorage.getItem(`kairo_last_completed_date_${user.uid}`);
    
    if (lastCompleted === todayStr) {
      return;
    }
    
    let newStreak = streak;
    if (lastCompleted === yesterdayStr || streak === 0) {
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }
    
    localStorage.setItem(`kairo_last_completed_date_${user.uid}`, todayStr);
    setStreak(newStreak);
    SocialService.syncProfile({ streak: newStreak });
    
    NotificationService.sendNotification("Racha Incremetada 🔥", `¡Excelente! Sintonía diaria racha #${newStreak}.`);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatTyping]);

  // Calculate Balance - Derived from real-time state
  const balance = useMemo(() => {
    const taskCompletion = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;
    const wellnessCompletion = wellness.length > 0 ? (wellness.filter(w => w.completed).length / wellness.length) * 100 : 0;
    const routineCompletion = routine.length > 0 ? (routine.filter(r => r.completed).length / routine.length) * 100 : 0;
    const eventCompletion = events.length > 0 ? (events.filter(e => e.completed).length / events.length) * 100 : 0;
    
    return Math.round((taskCompletion * 0.3) + (wellnessCompletion * 0.25) + (routineCompletion * 0.25) + (eventCompletion * 0.2));
  }, [tasks, wellness, routine, events]);

  // Firestore Real-time Sync
  useEffect(() => {
    let unsubscribeTasks: () => void;
    let unsubscribeHabits: () => void;
    let unsubscribeProfile: () => void;
    let unsubscribeAlarms: () => void;
    let unsubscribeEvents: () => void;
    let unsubscribeAchievements: () => void;
    let unsubscribeProgressHistory: () => void;

    if (isAuthenticated && user) {
      // Initialize profile if it doesn't exist
      SocialService.syncProfile({});

      // Subscribe to Profile
      unsubscribeProfile = SocialService.subscribeToProfile(async (profile) => {
        if (profile) {
          setStreak(profile.streak || 0);
          setMascotName(profile.mascotName || 'Kairo');
          checkStreakValidity(profile.streak || 0, user.uid);

          // Initialize default quick habits if not done yet
          if (!profile.habitsInitialized && !isQuotaExceededSync()) {
            try {
              const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid));
              const habitsSnap = await getDocs(habitsQuery);
              if (habitsSnap.empty) {
                const defaults = [
                  { label: 'Agua', type: 'water', completed: false, group: 'quickHabit' },
                  { label: 'Comida', type: 'food', completed: false, group: 'quickHabit' },
                  { label: 'Relax', type: 'rest', completed: false, group: 'quickHabit' },
                  { label: 'Zen', type: 'medicine', completed: false, group: 'quickHabit' },
                ];
                for (const h of defaults) {
                  await SocialService.saveHabit(h);
                }
              }
              await SocialService.syncProfile({ habitsInitialized: true });
            } catch (err) {
              if (isQuotaError(err)) {
                triggerQuotaExceeded();
              } else {
                console.error("Error logging or initializing default habits:", err);
              }
            }
          }
        }
      });

      // Subscribe to Tasks
      unsubscribeTasks = SocialService.subscribeToTasks((syncedTasks) => {
        setTasks(syncedTasks as Task[]);
      });

      // Subscribe to Wellness/Routine (Habits)
      unsubscribeHabits = SocialService.subscribeToHabits((syncedHabits) => {
        const wellnessItems = syncedHabits.filter(h => h.group === 'wellness' || h.group === 'quickHabit');
        const routineItems = syncedHabits.filter(h => h.group === 'routine');
        
        setWellness(wellnessItems as any[]);
        setRoutine(routineItems as RoutineItem[]);
      });

      // Subscribe to Alarms
      unsubscribeAlarms = SocialService.subscribeToAlarms((syncedAlarms) => {
        setAlarms(syncedAlarms as Alarm[]);
      });

      // Subscribe to Events
      unsubscribeEvents = SocialService.subscribeToEvents((syncedEvents) => {
        setEvents(syncedEvents as CalendarEvent[]);
      });

      // Subscribe to Achievements
      unsubscribeAchievements = SocialService.subscribeToAchievements((syncedAchievements) => {
        setAchievements(syncedAchievements);
      });

      // Subscribe to Progress History
      unsubscribeProgressHistory = SocialService.subscribeToProgressHistory((syncedHistory) => {
        setProgressHistory(syncedHistory);
      });
    }

    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeHabits) unsubscribeHabits();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeAlarms) unsubscribeAlarms();
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeAchievements) unsubscribeAchievements();
      if (unsubscribeProgressHistory) unsubscribeProgressHistory();
    };
  }, [isAuthenticated, user]);

  // Firebase Auth Lifecycle
  useEffect(() => {
    console.log("Initializing Auth Observer...");
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth State Changed:", u ? "Logged In" : "Logged Out");
      if (u) {
        setUser(u);
        setIsAuthenticated(true);
        setUserProfile({
          name: u.displayName || 'Usuario de Kairos',
          email: u.email || '',
          photo: u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`
        });
        
        // Sync profile but don't block
        SocialService.syncProfile({
          name: u.displayName || undefined,
          photoURL: u.photoURL || undefined,
          streak,
          balance,
          mascotName
        }).catch(err => console.error("Error syncing profile on auth change:", err));
      } else {
        setUser(null);
        setIsAuthenticated(false);
        // Reiniciar estados para un inicio limpio
        setTasks([]);
        setWellness([]);
        setRoutine([]);
        setEvents([]);
        setAlarms([]);
        setAchievements([]);
        setStreak(0);
        setMascotName('Kairo');
        setNotifications([]);
      }
      setIsLoadingAuth(false);
    }, (error) => {
      console.error("Auth Observer Error:", error);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Update profile in background when streak or balance changes
  useEffect(() => {
    if (isAuthenticated && user) {
      SocialService.syncProfile({ streak, balance, mascotName });
      
      const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      SocialService.saveProgressHistory(getLocalDateString(), balance);
      
      // Check for achievements
      ACHIEVEMENTS_LIST.forEach(ach => {
        if (!achievements.some(a => a.title === ach.title) && !unlockingTitles.current.has(ach.title)) {
           if (ach.condition(tasks, streak, balance, wellness)) {
             unlockingTitles.current.add(ach.title);
              SocialService.unlockAchievement({
               title: ach.title,
               description: ach.description,
               icon: ach.icon
             });
             // Add notification
             setNotifications(prev => [{
               id: Date.now().toString(),
               title: '¡Logro Desbloqueado!',
               message: `Has ganado el logro: ${ach.title}`,
               time: 'Justo ahora',
               read: false
             }, ...prev]);
           }
        }
      });
    }
  }, [streak, balance, mascotName, isAuthenticated, user, tasks, wellness, routine, achievements]);

  // Update time every minute for dynamic background & poll local notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (isAuthenticated && user) {
        NotificationService.checkSchedules({
          alarms,
          routine,
          wellness,
          streak,
          mascotName
        });
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [isAuthenticated, user, alarms, routine, wellness, streak, mascotName]);

  // Request notification permission on preferences change and check offline warnings
  useEffect(() => {
    if (preferences.pushNotifications) {
      NotificationService.requestPermission().then(granted => {
        if (granted) {
          NotificationService.recordAppOpening();
          NotificationService.getOfflineWarningStatus().then(warning => {
            if (warning) {
              NotificationService.sendNotification("Kairos Regreso 🐾", warning);
            }
          });
        }
      });
    }
  }, [preferences.pushNotifications]);

  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month'>('week');

  const statsData = useMemo(() => {
    if (progressHistory.length === 0) {
      return [{ day: 'Hoy', value: balance }];
    }
    
    const sorted = [...progressHistory].sort((a, b) => a.date.localeCompare(b.date));
    const limitCount = statsPeriod === 'week' ? 7 : 30;
    const filtered = sorted.slice(-limitCount);
    
    return filtered.map(item => {
      try {
        const d = new Date(item.date + 'T00:00:00');
        const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
        const formattedDayName = dayName ? dayName.charAt(0).toUpperCase() + dayName.slice(1).replace('.', '') : item.date;
        return {
          day: formattedDayName,
          value: item.value
        };
      } catch (e) {
        return {
          day: item.date,
          value: item.value
        };
      }
    });
  }, [progressHistory, balance, statsPeriod]);

  // Handle Send Chat Message
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsChatTyping(true);

    const snapshot: UserSnapshot = {
      tasksCompleted: tasks.filter(t => t.completed).length,
      tasksTotal: tasks.length || 1,
      routineCompleted: routine.filter(r => r.completed).length,
      routineTotal: routine.length || 1,
      wellnessCompleted: wellness.filter(w => w.completed).length,
      wellnessTotal: wellness.length || 1,
      streak,
      balance,
      mascotName,
      state: balance > 70 ? 'constant' : balance < 30 ? 'inactive' : 'active'
    };

    const activeMessages = [
      ...chatMessages,
      { sender: 'user' as const, text: userText }
    ];

    try {
      const gptReply = await AIService.getChatResponse(snapshot, activeMessages);
      setChatMessages(prev => [...prev, { sender: 'bot', text: gptReply }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setChatMessages(prev => [...prev, { sender: 'bot', text: "Lo siento, mi conexión con el flujo temporal se ha visto alterada de momento. Inténtenlo de nuevo por favor." }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  // Toggle Alarm
  const toggleAlarm = (id: string) => {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      SocialService.saveAlarm({ ...alarm, enabled: !alarm.enabled });
    }
  };

  const backgroundStyle = useMemo(() => {
    if (preferences.darkMode) {
      return 'from-slate-950 via-slate-900 to-slate-950';
    }
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'from-amber-50 via-orange-50 to-sky-100'; // Morning
    if (hour >= 12 && hour < 17) return 'from-sky-100 via-blue-50 to-white'; // Afternoon
    if (hour >= 17 && hour < 20) return 'from-orange-100 via-rose-100 to-sunset-wine/20'; // Sunset
    return 'from-slate-900 via-sunset-wine/40 to-slate-900'; // Night
  }, [currentTime, preferences.darkMode]);

  const [isNight, setIsNight] = useState(currentTime.getHours() >= 20 || currentTime.getHours() < 5);

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [taskCategories, setTaskCategories] = useState<Category[]>(DEFAULT_TASK_CATEGORIES);
  const [eventCategories, setEventCategories] = useState<Category[]>(DEFAULT_EVENT_CATEGORIES);
  const [routineCategories, setRoutineCategories] = useState<Category[]>(DEFAULT_ROUTINE_CATEGORIES);
  const [locationCategories, setLocationCategories] = useState<Category[]>(DEFAULT_LOCATION_CATEGORIES);
  
  const [locations, setLocations] = useState<LocationTime[]>(MOCK_LOCATION);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modal States
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isWellnessModalOpen, setIsWellnessModalOpen] = useState(false);
  
  const [isTaskCategoryModalOpen, setIsTaskCategoryModalOpen] = useState(false);
  const [isEventCategoryModalOpen, setIsEventCategoryModalOpen] = useState(false);
  const [isLocationCategoryModalOpen, setIsLocationCategoryModalOpen] = useState(false);
  const [isRoutineCategoryModalOpen, setIsRoutineCategoryModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isAddQuickHabitOpen, setIsAddQuickHabitOpen] = useState(false);
  const [newQuickHabitName, setNewQuickHabitName] = useState('');

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation chosen: ${outcome}`);
    setDeferredPrompt(null);
  };

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const [userProfile, setUserProfile] = useState({
    name: 'Usuario de Kairos',
    email: '',
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=kairos`
  });

  // AI Insights State
  const [aiThought, setAiThought] = useState<string>('Sintonizando con tu esencia...');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiConsultationOpen, setIsAiConsultationOpen] = useState(false);
  const [consultationResponse, setConsultationResponse] = useState('');
  const [activeQueryType, setActiveQueryType] = useState<AIQueryType | null>(null);
  const [userQuestion, setUserQuestion] = useState('');

  const ACHIEVEMENTS_LIST = [
    { title: 'Primer Paso', description: 'Completa tu primera tarea', icon: '🎯', condition: (tasks: any[], _streak: number, _balance: number, _wellness: any[]) => tasks.some(t => t.completed) },
    { title: 'Ritualista', description: 'Completa todos tus hábitos de bienestar en un día', icon: '🧘', condition: (_tasks: any[], _streak: number, _balance: number, wellness: any[]) => wellness.length > 0 && wellness.every(w => w.completed) },
    { title: 'Guardián del Tiempo', description: 'Mantén una racha de 3 días', icon: '⏳', condition: (_tasks: any[], streak: number, _balance: number, _wellness: any[]) => streak >= 3 },
    { title: 'Armonía Total', description: 'Logra 100% de Esencia', icon: '✨', condition: (_tasks: any[], _streak: number, balance: number, _wellness: any[]) => balance === 100 },
    { title: 'Constante', description: 'Mantén una racha de 7 días', icon: '🏆', condition: (_tasks: any[], streak: number, _balance: number, _wellness: any[]) => streak >= 7 },
    { title: 'Maestro Kairos', description: 'Logra más de 80% de Esencia por primera vez', icon: '👑', condition: (_tasks: any[], _streak: number, balance: number, _wellness: any[]) => balance >= 80 },
  ];

  const lastAIRequestTime = React.useRef<number>(0);
  const aiCooldownMs = 8000; // 8 second cooldown for random thoughts

  const refreshAIThought = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && (isAiThinking || now - lastAIRequestTime.current < aiCooldownMs)) return;
    
    setIsAiThinking(true);
    lastAIRequestTime.current = now;
    
    const snapshot: UserSnapshot = {
      tasksCompleted: tasks.filter(t => t.completed).length,
      tasksTotal: tasks.length || 1,
      routineCompleted: routine.filter(r => r.completed).length,
      routineTotal: routine.length || 1,
      wellnessCompleted: wellness.filter(w => w.completed).length,
      wellnessTotal: wellness.length || 1,
      streak,
      balance,
      mascotName,
      state: balance > 70 ? 'constant' : balance < 30 ? 'inactive' : 'active'
    };

    try {
      const thought = await AIService.getMascotThought(snapshot);
      setAiThought(thought);
    } catch (e) {
      console.error("AI Thought error", e);
    } finally {
      setIsAiThinking(false);
    }
  };

  const consultAI = async (type: AIQueryType) => {
    if (isAiThinking) return;
    setIsAiThinking(true);
    setActiveQueryType(type);
    
    // Smooth transition: clear previous response if switching types
    if (type !== activeQueryType) {
      setConsultationResponse('');
    }
    
    const snapshot: UserSnapshot = {
      tasksCompleted: tasks.filter(t => t.completed).length,
      tasksTotal: tasks.length || 1,
      routineCompleted: routine.filter(r => r.completed).length,
      routineTotal: routine.length || 1,
      wellnessCompleted: wellness.filter(w => w.completed).length,
      wellnessTotal: wellness.length || 1,
      streak,
      balance,
      mascotName,
      state: balance > 70 ? 'constant' : balance < 30 ? 'inactive' : 'active'
    };

    try {
      const response = await AIService.getMascotThought(snapshot, type, type === 'open' ? userQuestion : undefined);
      setConsultationResponse(response);
    } catch (error) {
      setConsultationResponse("Hubo un error al sintonizar con Kairo. Inténtalo de nuevo.");
    } finally {
      setIsAiThinking(false);
      lastAIRequestTime.current = Date.now(); // Reset cooldown after manual consultation
      if (type === 'open') setUserQuestion('');
    }
  };

  // Refresh AI thought on load and tab change back to dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      refreshAIThought();
    }
  }, [activeTab]);

  // Auto-hide AI thought after 10 seconds
  useEffect(() => {
    if (aiThought && aiThought !== 'Sintonizando con tu esencia...') {
      const timer = setTimeout(() => {
        setAiThought('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [aiThought]);

  // Persistence Effects handled by Firestore subscribers
  const [isMascotRenameOpen, setIsMascotRenameOpen] = useState(false);

  useEffect(() => {
    // Streak logic removed from local state, now handled solely by syncProfile logic or AI services if needed.
    // However, to follow the requirement "streak starts at 0", we ensure the initial profile sync has streak 0.
  }, [lastCheckIn]);

  // Form States
  const [newAlarm, setNewAlarm] = useState({ title: '', time: '08:00', category: 'meal' });
  const [newCategory, setNewCategory] = useState({ name: '', color: 'indigo' });
  const [newTask, setNewTask] = useState({ title: '', category: 'work' });
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '09:00', endTime: '10:00', location: '', type: 'work' });
  const [newLocation, setNewLocation] = useState({ name: '', time: 0, category: 'home' });
  const [newRoutine, setNewRoutine] = useState({ time: '07:00', activity: '', type: 'rest' });
  const [newWellness, setNewWellness] = useState({ type: 'water' as const, label: '', time: '10:00' });

  // Generate next 7 days for the horizontal picker
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const willBeCompleted = !task.completed;
      if (willBeCompleted) markActivityCompletedToday();
      SocialService.saveTask({ ...task, completed: willBeCompleted });
    }
    setTimeout(refreshAIThought, 1000); 
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      setIsDeletingAccount(true);
      console.log("Iniciando proceso de eliminación de cuenta para el usuario:", user.uid);
      
      if (!isQuotaExceededSync()) {
        // 1. Borrar todas las colecciones del usuario en Firestore
        const collections = ['tasks', 'habits', 'alarms', 'events', 'achievements'];
        console.log("Paso 1: Detectando y eliminando colecciones de Firestore del usuario:", collections);
        for (const col of collections) {
          console.log(`Buscando documentos en la colección '${col}'...`);
          const q = query(collection(db, col), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          console.log(`Colección '${col}': Encontrados ${snap.size} documentos para eliminar.`);
          for (const document of snap.docs) {
            await deleteDoc(doc(db, col, document.id));
          }
        }
        
        // 2. Borrar documento del usuario
        console.log("Paso 2: Eliminando documento de usuario de Firestore ('users')");
        await deleteDoc(doc(db, 'users', user.uid));
      } else {
        console.log("Firestore quota is exceeded. Skipping remote Firebase deletions and executing local cleanup only.");
      }
      
      // 3. Eliminar cuenta de Firebase Auth
      console.log("Paso 3: Eliminando usuario de Firebase Authentication");
      await user.delete();
      
      // 4. Sign out
      console.log("Paso 4: Cerrando sesión y limpiando estado");
      await signOut(auth);
      
    } catch (error: any) {
      console.error('Error completo detectado al eliminar cuenta:', error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Por seguridad, cierra sesión, vuelve a iniciar sesión con Google y luego intenta eliminar tu cuenta nuevamente.");
      } else {
        alert(`Ocurrió un error al intentar eliminar la cuenta: ${error.message || error}`);
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const toggleWellness = (id: string) => {
    if (deletedHabitIds.includes(id)) return; // guard: don't re-save a deleted habit
    const item = wellness.find(w => w.id === id);
    if (item) {
      const willBeCompleted = !item.completed;
      if (willBeCompleted) markActivityCompletedToday();
      SocialService.saveHabit({ ...item, completed: willBeCompleted, category: 'wellness' });
    }
    setTimeout(refreshAIThought, 1000);
  };

  const toggleRoutine = (id: string) => {
    const item = routine.find(r => r.id === id);
    if (item) {
      const willBeCompleted = !item.completed;
      if (willBeCompleted) markActivityCompletedToday();
      SocialService.saveHabit({ ...item, completed: willBeCompleted, category: 'routine' });
    }
    setTimeout(refreshAIThought, 1000);
  };

  const toggleEvent = (id: string) => {
    const event = events.find(e => e.id === id);
    if (event) {
      const willBeCompleted = !event.completed;
      if (willBeCompleted) markActivityCompletedToday();
      SocialService.saveEvent({ ...event, completed: willBeCompleted });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photo = reader.result as string;
        setUserProfile({ ...userProfile, photo });
        SocialService.syncProfile({ photoURL: photo });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderContent = () => {
    const nivel = Math.max(1, Math.floor(streak * 0.5 + balance * 0.3));
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 pb-36 md:pb-12">
            {/* Immersive Header Card */}
            <section className="px-4 sm:px-6 md:px-8 pt-6">
              <header className="mb-8 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset-orange animate-pulse" />
                  <p className="text-[10px] font-black text-sunset-orange uppercase tracking-[0.3em] italic">Resumen</p>
                </div>
                <h2 className={`text-4xl font-black ${theme.textTitle} tracking-tight leading-none italic`}>Mi Centro</h2>
              </header>

              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${preferences.darkMode ? 'bg-slate-900' : 'bg-sunset-pink'} rounded-3xl md:rounded-[3.5rem] py-6 px-5 xs:p-8 text-white relative overflow-hidden h-auto min-h-[180px] md:h-[240px]`}
              >
                {/* Abstract shapes behind */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-12 -translate-x-12 blur-2xl" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-white/80 font-bold text-sm">Hola, {userProfile.name.split(' ')[0]} 👋</p>
                      <h1 className="text-2xl font-black">{currentTime.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</h1>
                    </div>
                    <div className="flex gap-4 items-center">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsProfileOpen(true)}
                        className="w-12 h-12 rounded-[1.5rem] border-2 border-white/40 overflow-hidden"
                      >
                        <img src={userProfile.photo} alt="P" className="w-full h-full object-cover" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/20 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/20">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 italic">Nivel {nivel}</p>
                          <h2 className="text-xl font-black leading-none">Mi Esencia Kairos</h2>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full border border-white/10">
                            <Zap size={14} className="text-sunset-orange" />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">Activo</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full border border-white/10">
                            <TrendingUp size={14} className="text-white" />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">#{streak}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Bento Grid Content */}
            <section className="px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Mascot Card */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`${theme.card} rounded-3xl md:rounded-[3.5rem] p-4 ${theme.shadow} border ${theme.border} flex flex-col justify-between h-auto min-h-[380px] md:h-[420px] relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <div className="w-32 h-32 bg-deep-teal rounded-full" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Mascot and Progress Ring */}
                   <div className="relative flex-1 flex items-center justify-center scale-90">
                      <TimeMascot streak={streak} balance={balance} className="py-2" />
                   </div>
                   
                    <button 
                      onClick={() => setActiveTab('stats')} 
                      className="bg-deep-teal rounded-[3rem] p-6 text-white w-full flex justify-between items-center hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <div className="space-y-1 text-left">
                        <p className="text-[10px] font-black tracking-[0.2em] opacity-60 uppercase italic">Sincronía</p>
                        <h3 className="text-3xl font-black leading-none">{balance}%</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Ver</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Progreso</span>
                        <span className="text-white text-lg leading-none">→</span>
                      </div>
                    </button>
                </div>
              </motion.div>

                {/* Stats and Learning cards column */}
                <div className="flex flex-col gap-6">
                  {/* Secondary Stat Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`${theme.cardSecondary} rounded-3xl md:rounded-[3.5rem] py-6 px-5 xs:p-8 ${theme.shadow} border ${theme.border} flex flex-col gap-8`}
                  >
                    <div className={`${theme.card} rounded-2xl md:rounded-[2.5rem] p-5 xs:p-6 shadow-inner relative`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className={`text-sm font-black ${theme.textTitle} tracking-tight`}>Evolución de Energía</h4>
                       <span className="text-[10px] font-black text-sunset-orange uppercase tracking-widest">{balance}% prom.</span>
                    </div>
                    {/* Simplified Graph Visual */}
                    <div className="h-20 w-full flex items-end gap-2 px-2">
                       {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                          <motion.div 
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            className={`flex-1 rounded-full ${i === 3 ? 'bg-sunset-pink shadow-[0_0_15px_rgba(255,117,151,0.4)]' : 'bg-slate-200'}`}
                          />
                       ))}
                    </div>
                  </div>
                </motion.div>

                {/* State Interpretation Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-deep-teal rounded-3xl md:rounded-[3.5rem] py-6 px-5 xs:p-8 text-white relative overflow-hidden"
                >
                   <div className="relative z-10 flex justify-between items-center">
                      <div className="space-y-4 max-w-[70%]">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black text-mint uppercase tracking-[0.3em]">IA KAIROS</p>
                            <h3 className="text-lg font-black leading-tight italic opacity-90">
                              {balance > 60 ? 'Toda tu esencia hoy fluye como un río tranquilo.' : 'Es tiempo de reconectar y fluir más lento.'}
                            </h3>
                         </div>
                         <motion.button 
                           whileHover={{ x: 5 }}
                           onClick={() => setIsChatOpen(true)}
                           className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white/50 hover:text-mint transition-colors"
                         >
                           Explorar Más <ArrowRight size={14} />
                         </motion.button>
                      </div>
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center p-3 border border-white/10">
                         <div className="w-full h-full rounded-full border-4 border-mint/40 border-t-mint animate-spin-slow rotate-[45deg]" />
                      </div>
                   </div>
                </motion.div>
              </div>
            </section>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-8 pb-36 md:pb-12 px-4 sm:px-6 md:px-8 pt-6 md:pt-12 no-scrollbar">
            <header className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset-pink animate-pulse" />
                  <p className="text-[10px] font-black text-sunset-pink uppercase tracking-[0.3em] italic">Proceso</p>
                </div>
                <h2 className={`text-4xl font-black ${theme.textTitle} tracking-tight leading-none italic`}>Metas</h2>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsTaskModalOpen(true)}
                className={`w-16 h-16 ${theme.textTitle === 'text-white' ? 'bg-mint text-slate-950' : 'bg-deep-teal text-white'} rounded-[2.5rem] flex items-center justify-center shadow-2xl`}
              >
                <Plus size={32} />
              </motion.button>
            </header>



            {/* Featured Course Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${preferences.darkMode ? 'bg-slate-900' : 'bg-[#d5e8e1]'} rounded-3xl md:rounded-[3.5rem] py-6 px-5 xs:p-8 relative overflow-hidden group min-h-[220px] flex flex-col justify-between`}
            >
               <div className="absolute top-0 right-0 p-6 opacity-20 transition-transform group-hover:scale-110 duration-500">
                  <FileText size={140} className={`rotate-12 ${preferences.darkMode ? 'text-white/10' : 'text-deep-teal'}`} />
               </div>
               <div className="space-y-4 relative z-10">
                  <div className={`${preferences.darkMode ? 'bg-white/10' : 'bg-white/40'} backdrop-blur-xl px-4 py-2 rounded-full w-fit border border-white/20`}>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${preferences.darkMode ? 'text-white/70' : 'text-deep-teal'}`}>Objetivo Semanal</span>
                  </div>
                  <h3 className={`text-3xl font-black ${preferences.darkMode ? 'text-white' : 'text-deep-teal'} tracking-tight leading-tight max-w-[200px]`}>Sincronía de Hábitos</h3>
               </div>
               <div className="flex gap-4 relative z-10 pt-4">
                  <div className="flex flex-col">
                     <span className={`text-[10px] font-black ${preferences.darkMode ? 'text-white/30' : 'text-deep-teal/40'} uppercase tracking-widest leading-none`}>Lecciones</span>
                     <span className={`text-xl font-black ${preferences.darkMode ? 'text-white/90' : 'text-deep-teal'}`}>#{tasks.length}</span>
                  </div>
                  <div className="flex flex-col">
                     <span className={`text-[10px] font-black ${preferences.darkMode ? 'text-white/30' : 'text-deep-teal/40'} uppercase tracking-widest leading-none`}>Minutos</span>
                     <span className={`text-xl font-black ${preferences.darkMode ? 'text-white/90' : 'text-deep-teal'}`}>120m</span>
                  </div>
               </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-4">
              {tasks.map((task) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => toggleTask(task.id)}
                  className={`bento-card flex items-center justify-between cursor-pointer border ${theme.border} ${task.completed ? theme.itemBg + ' opacity-60' : theme.card + ' ' + theme.shadow}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center shadow-inner transition-colors ${
                      task.completed ? theme.itemBg + ' ' + theme.textMuted : 'bg-sunset-pink/10 text-sunset-pink'
                    }`}>
                      {task.completed ? <Check size={24} /> : <Zap size={24} />}
                    </div>
                    <div className="space-y-0.5">
                      <span className={`text-lg font-black transition-all leading-tight block ${task.completed ? theme.textMuted + ' line-through' : theme.textTitle}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-sunset-orange uppercase tracking-widest bg-sunset-orange/5 px-2 py-0.5 rounded-full">{task.category}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); SocialService.deleteTask(task.id); }}
                    className="p-3 text-slate-300 hover:text-sunset-red transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Quick Habits Section */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`${theme.card} rounded-3xl md:rounded-[3.5rem] py-6 px-5 xs:p-8 shadow-xl ${theme.shadow} border ${theme.border}`}
            >
              <div className="flex justify-between items-center mb-6">
                 <div className="space-y-0.5">
                    <h3 className={`text-xl font-black tracking-tighter ${preferences.darkMode ? 'text-white' : 'text-deep-teal'}`}>Hábitos Rápidos</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Acción Inmediata</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 gap-3 sm:gap-4">
                {/* Unified Habits (Defaults & Customs) */}
                {(() => {
                  const getMs = (h: any) => {
                    if (!h.createdAt) return Date.now();
                    if (typeof h.createdAt.toMillis === 'function') return h.createdAt.toMillis();
                    if (typeof h.createdAt.toDate === 'function') return h.createdAt.toDate().getTime();
                    if (h.createdAt.seconds) return h.createdAt.seconds * 1000 + Math.floor(h.createdAt.nanoseconds / 1000000);
                    if (h.createdAt instanceof Date) return h.createdAt.getTime();
                    if (typeof h.createdAt === 'string') return new Date(h.createdAt).getTime();
                    if (typeof h.createdAt === 'number') return h.createdAt;
                    return 0;
                  };

                  const quickHabits = wellness.filter(w => w.group === 'quickHabit' && !deletedHabitIds.includes(w.id));
                  const sortedQuickHabits = [...quickHabits].sort((a, b) => getMs(b) - getMs(a));
                  const uniqueQuickHabitsMap = new Map<string, any>();
                  
                  for (const h of sortedQuickHabits) {
                    const uniqueKey = h.type === 'custom' ? `custom-${h.label.toLowerCase().trim()}` : h.type;
                    if (!uniqueQuickHabitsMap.has(uniqueKey)) {
                      uniqueQuickHabitsMap.set(uniqueKey, h);
                    }
                  }

                  const uniqueQuickHabits = Array.from(uniqueQuickHabitsMap.values());
                  const typeOrder = ['water', 'food', 'rest', 'medicine', 'exercise', 'zen', 'custom'];
                  const getOrderIndex = (type: string) => {
                    const idx = typeOrder.indexOf(type);
                    return idx === -1 ? 999 : idx;
                  };
                  uniqueQuickHabits.sort((a, b) => getOrderIndex(a.type) - getOrderIndex(b.type));

                  return uniqueQuickHabits.map((habit) => {
                    const visual = resolveCustomHabitVisuals(habit.label, habit.completed, preferences.darkMode);
                    return (
                      <div key={habit.id} className="flex flex-col items-center gap-2 relative">
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleWellness(habit.id)}
                            className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 shadow-sm relative ${visual.classes}`}
                          >
                            {visual.icon}
                            {habit.completed && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-mint rounded-full flex items-center justify-center border-2 border-white z-10"
                              >
                                <Check size={10} className="text-white" strokeWidth={4} />
                              </motion.div>
                            )}
                          </motion.button>
                          
                          {/* Small X button to delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletedHabitIds((prev) => [...prev, habit.id]);
                              SocialService.deleteHabit(habit.id);
                            }}
                            className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-white text-white hover:bg-red-600 transition-colors shadow-sm z-20"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 text-center line-clamp-1 w-16">
                          {habit.label}
                        </span>
                      </div>
                    );
                  });
                })()}

                {/* Add Custom Quick Habit Plus Button */}
                <div className="flex flex-col items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setNewQuickHabitName('');
                      setIsAddQuickHabitOpen(true);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border border-dashed ${
                      preferences.darkMode 
                        ? 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white' 
                        : 'border-slate-300 bg-slate-50 text-slate-400 hover:text-deep-teal'
                    }`}
                  >
                    <Plus size={20} />
                  </motion.button>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                    Nuevo
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        );
      case 'wellness':
        return (
          <div className="space-y-8 pb-36 md:pb-12 px-4 sm:px-6 md:px-8 pt-6 md:pt-12 no-scrollbar">
            <header className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                <p className="text-[10px] font-black text-mint uppercase tracking-[0.3em] italic">Esencia</p>
              </div>
              <h2 className={`text-4xl font-black ${theme.textTitle} tracking-tight leading-none italic`}>Mi Vida</h2>
            </header>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              {wellness.map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ y: -4 }}
                  onClick={() => toggleWellness(item.id)}
                  className={`bento-card flex flex-col gap-6 cursor-pointer border ${theme.border} ${
                    item.completed ? theme.itemBg + ' opacity-60' : theme.card + ' ' + theme.shadow
                  }`}
                >
                  <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center shadow-inner ${
                    item.completed ? theme.itemBg + ' ' + theme.text : 
                    item.type === 'water' ? 'bg-sky-100/20 text-sky-500' :
                    item.type === 'food' ? 'bg-orange-100/20 text-orange-500' :
                    item.type === 'medicine' ? 'bg-indigo-100/20 text-indigo-500' :
                    item.type === 'rest' ? 'bg-purple-100/20 text-purple-500' :
                    theme.itemBg + ' ' + theme.textMuted
                  }`}>
                    {item.type === 'water' ? <Droplets size={24} /> :
                     item.type === 'food' ? <Utensils size={24} /> :
                     item.type === 'medicine' ? <Pill size={24} /> :
                     item.type === 'rest' || item.type === 'sleep' ? <Moon size={24} /> :
                     <Sparkles size={24} />}
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-base font-black leading-tight ${item.completed ? theme.textMuted + ' line-through' : theme.textTitle}`}>
                      {item.label}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="space-y-8 pb-36 md:pb-12 px-4 sm:px-6 md:px-8 pt-6 md:pt-12 navigation-safe">
            <header className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-sunset-wine tracking-tight">Agenda</h2>
                <p className="text-sunset-wine/40 font-bold">Tu flujo del tiempo.</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEventModalOpen(true)}
                className="w-14 h-14 sunset-gradient text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-sunset-orange/30"
              >
                <Plus size={28} />
              </motion.button>
            </header>

            <div className="space-y-4">
              {events.map((event) => (
                <motion.div 
                  key={event.id}
                  className={`glass-card p-0 overflow-hidden bg-white/60 backdrop-blur-xl border-none shadow-lg flex transition-all ${event.completed ? 'opacity-50 grayscale-[0.5]' : ''}`}
                >
                  <div className={`w-2 ${event.completed ? 'bg-slate-300' : 'sunset-gradient'}`} />
                  <div className="p-4 sm:p-6 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <h3 className={`text-xl font-black ${event.completed ? 'text-sunset-wine/40 line-through' : 'text-sunset-wine'}`}>{event.title}</h3>
                      <div className="flex items-center gap-3 text-sunset-wine/60 font-bold text-xs">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{event.startTime} - {event.endTime}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-4 py-1.5 bg-sunset-orange/10 rounded-full">
                        <span className="text-[10px] font-black text-sunset-orange uppercase tracking-widest">{event.category}</span>
                      </div>
                      <button 
                        onClick={() => toggleEvent(event.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${event.completed ? 'bg-mint text-white' : 'bg-white border-2 border-slate-100 text-transparent hover:border-mint'}`}
                      >
                        <Check size={16} className={event.completed ? 'opacity-100' : 'opacity-0'} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'alarms':
        return (
          <div className="space-y-8 pb-36 md:pb-12 px-4 sm:px-6 md:px-8 pt-6 md:pt-12 no-scrollbar">
            <header className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sunset-orange animate-pulse" />
                  <p className="text-[10px] font-black text-sunset-orange uppercase tracking-[0.3em] italic">Ritmo Vital</p>
                </div>
                <h2 className="text-4xl font-black text-deep-teal tracking-tight leading-none italic">Alarmas</h2>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAlarmModalOpen(true)}
                className="w-16 h-16 bg-deep-teal text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-deep-teal/20"
              >
                <Plus size={32} />
              </motion.button>
            </header>



            <div className="space-y-4">
              {alarms.map((alarm) => (
                <motion.div 
                  key={alarm.id}
                  whileHover={{ scale: 1.02 }}
                  className={`${theme.card} rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 flex justify-between items-center shadow-xl ${theme.shadow} border ${theme.border}`}
                >
                   <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-white ${
                        alarm.category === 'meal' ? 'bg-orange-400' : 
                        alarm.category === 'medicine' ? 'bg-sky-400' : 'bg-indigo-400'
                      }`}>
                         <AlarmClock size={24} />
                      </div>
                      <div>
                         <h4 className={`text-2xl font-black ${theme.textTitle} tracking-tight`}>{alarm.time}</h4>
                         <p className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest leading-none mt-1`}>{alarm.title} • {alarm.days.join(', ')}</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => toggleAlarm(alarm.id)}
                     className={`w-12 h-6 rounded-full p-1 transition-colors relative ${alarm.enabled ? 'bg-mint' : (preferences.darkMode ? 'bg-slate-800' : 'bg-slate-200')}`}
                   >
                      <motion.div 
                        animate={{ x: alarm.enabled ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                   </button>
                </motion.div>
              ))}
              
              {alarms.length === 0 && (
                <div className="bg-slate-50 rounded-[3rem] p-12 text-center border border-dashed border-slate-200">
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest font-mono">No hay alarmas activas</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="space-y-8 pb-36 md:pb-12 px-4 sm:px-6 md:px-8 pt-6 md:pt-12 no-scrollbar">
            {/* Organic User Profile Header */}
            <div className={`${theme.card} rounded-3xl md:rounded-[4rem] py-6 px-4 xs:p-8 md:p-10 ${theme.shadow} border ${theme.border} flex flex-col items-center text-center gap-6 relative overflow-hidden`}>
               <div className="absolute top-0 inset-x-0 h-24 sunset-gradient opacity-10" />
               
               <div className="relative">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className={`w-32 h-32 rounded-[3.5rem] ${theme.card} p-1.5 shadow-2xl relative z-10 overflow-hidden`}
                  >
                    <img 
                      src={user?.photoURL || userProfile.photo} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-[3rem]"
                    />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-sunset-orange blur-3xl rounded-full opacity-20 -z-0"
                  />
               </div>

               <div className="space-y-1 relative z-10">
                  <h2 className={`text-3xl font-black ${theme.textTitle} tracking-tighter italic`}>
                     {user?.displayName || userProfile.name}
                  </h2>
                  <p className="text-[10px] font-black text-sunset-orange uppercase tracking-[0.3em]">
                     {user?.email || userProfile.email}
                  </p>
               </div>

               {/* Key Stats Bar */}
               <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full pt-4">
                  <div className={`${preferences.darkMode ? 'bg-rose-950/20' : 'bg-rose-50/50'} rounded-2xl md:rounded-[2.5rem] py-4 px-3 sm:p-6 space-y-2 border ${preferences.darkMode ? 'border-rose-900/30' : 'border-rose-100/50'} flex flex-col justify-center`}>
                     <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest leading-none text-center">Racha Vital</p>
                     <div className="flex items-center justify-center gap-2">
                        <Zap size={20} className="text-sunset-orange flex-shrink-0" fill="currentColor" />
                        <span className={`text-2xl font-black ${theme.textTitle} leading-none`}>{streak}</span>
                     </div>
                  </div>
                  <div className={`${theme.itemBg} rounded-2xl md:rounded-[2.5rem] py-4 px-3 sm:p-6 space-y-2 border ${theme.border} flex flex-col justify-center`}>
                     <p className={`text-[9px] font-black ${theme.textMuted} uppercase tracking-widest leading-none text-center`}>Esencia Hoy</p>
                     <div className="flex items-center justify-center gap-2">
                        <Clock size={20} className={`${theme.textTitle} flex-shrink-0`} fill="currentColor" />
                        <span className={`text-2xl font-black ${theme.textTitle} leading-none font-mono`}>{balance}%</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Mascot State Card */}
            <div className={`${preferences.darkMode ? 'bg-slate-900' : 'bg-deep-teal'} rounded-3xl md:rounded-[4rem] py-6 px-4 xs:p-8 md:p-10 text-white relative overflow-hidden group shadow-xl`}>
               <div className={`absolute top-[-20%] right-[-10%] w-64 h-64 ${preferences.darkMode ? 'bg-sunset-orange/20' : 'bg-white/10'} rounded-full blur-[100px] group-hover:opacity-60 transition-opacity duration-1000`} />
               <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5 sm:gap-8 relative z-10">
                  <div className={`w-24 h-24 ${preferences.darkMode ? 'bg-white/10' : 'bg-white/20'} backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10`}>
                     <div className="scale-75">
                        <TimeMascot streak={streak} balance={balance} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-xl font-black italic tracking-tight">{mascotName}</h3>
                     <p className="text-sm text-white/50 leading-relaxed font-medium">
                        {balance > 70 ? '¡Está rebosante de energía y armonía!' : balance > 40 ? 'Se siente en equilibrio, pero quiere más.' : 'Necesita un poco de sintonía con tu tiempo.'}
                     </p>
                  </div>
               </div>
               <button 
                 onClick={() => setIsMascotRenameOpen(true)}
                 className="absolute bottom-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
               >
                 <Edit2 size={16} />
               </button>
            </div>

            {/* Stats Visualization Section */}
            <div className={`${theme.card} rounded-3xl md:rounded-[4rem] py-6 px-4 xs:p-8 md:p-10 ${theme.shadow} border ${theme.border} space-y-8`}>
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="space-y-1">
                    <h3 className={`text-2xl font-black ${theme.textTitle} tracking-tighter italic leading-none`}>Progreso</h3>
                    <p className={`text-[9px] font-black ${theme.textMuted} uppercase tracking-widest leading-none`}>Análisis de ritmo</p>
                 </div>
                 <div className={`${theme.itemBg} p-1.5 rounded-full flex gap-1 self-stretch sm:self-auto justify-center`}>
                    {['week', 'month'].map(p => (
                      <button 
                        key={p}
                        onClick={() => setStatsPeriod(p as any)}
                        className={`px-5 py-2.5 text-[9px] font-black rounded-full uppercase tracking-widest transition-all ${
                          statsPeriod === p ? 'bg-deep-teal text-white shadow-xl' : theme.textMuted
                        }`}
                      >
                        {p === 'week' ? 'Semana' : 'Mes'}
                      </button>
                    ))}
                 </div>
              </header>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={statsPeriod === 'week' ? '#41b8a2' : '#ff7597'} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={statsPeriod === 'week' ? '#41b8a2' : '#ff7597'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={preferences.darkMode ? '#ffffff10' : "#f8fafc"} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: preferences.darkMode ? '#94a3b8' : '#cbd5e1', letterSpacing: '0.1em'}} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: preferences.darkMode ? '#1e293b' : 'rgba(29, 77, 79, 0.95)', borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}
                      itemStyle={{ color: 'white', fontWeight: 900, fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={statsPeriod === 'week' ? '#41b8a2' : '#ff7597'} 
                      strokeWidth={6} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      strokeLinecap="round" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Achievements Grid */}
              <div className={`space-y-6 pt-6 border-t ${theme.border}`}>
                 <div className="flex justify-between items-center">
                    <h4 className={`text-[10px] font-black ${theme.textTitle} uppercase tracking-[0.3em]`}>Logros Coleccionados</h4>
                    <span className={`text-[10px] font-black text-sunset-orange ${preferences.darkMode ? 'bg-rose-950/20' : 'bg-rose-50'} px-3 py-1 rounded-full`}>{ACHIEVEMENTS_LIST.filter(ach => achievements.some(a => a.title === ach.title)).length} / {ACHIEVEMENTS_LIST.length}</span>
                 </div>
                 <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 gap-3">
                    {ACHIEVEMENTS_LIST.map((ach) => {
                       const isUnlocked = achievements.some(a => a.title === ach.title);
                       return (
                         <motion.div 
                           key={ach.title}
                           whileHover={isUnlocked ? { scale: 1.1, rotate: 5 } : {}}
                           className={`aspect-square rounded-3xl flex items-center justify-center text-2xl shadow-sm transition-all relative group ${
                             isUnlocked ? 'bg-amber-50 text-amber-500 border border-amber-100 shadow-amber-100/50' : `${theme.itemBg} ${theme.textMuted} grayscale`
                           }`}
                         >
                           {ach.icon}
                           
                           {/* Tooltip on hover */}
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900 text-white text-[8px] font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              {ach.title}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                           </div>
                         </motion.div>
                       );
                    })}
                 </div>
              </div>
            </div>

            {/* Account Settings Compact Card */}
            <div className={`${theme.card} rounded-[3.5rem] p-6 ${theme.shadow} border ${theme.border} grid grid-cols-3 gap-2`}>
               <button 
                 onClick={() => setIsPreferencesOpen(true)}
                 className={`p-4 ${theme.itemBg} rounded-3xl flex flex-col items-center justify-center gap-2 hover:opacity-80 transition-opacity`}
               >
                 <Settings size={18} className={theme.textMuted} />
                 <span className={`text-[8px] font-black uppercase tracking-widest ${theme.textMuted} text-center`}>Ajustes</span>
               </button>
               <button 
                 onClick={() => setIsDeleteAccountOpen(true)}
                 className={`p-4 ${preferences.darkMode ? 'bg-red-950/20' : 'bg-red-50/50'} rounded-3xl flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-allDuration`}
                 style={{ transition: 'all 0.2s ease' }}
               >
                 <Trash2 size={18} className="text-red-400" />
                 <span className={`text-[8px] font-black uppercase tracking-widest text-red-500 text-center`}>Borrar</span>
               </button>
               <button 
                 onClick={() => signOut(auth)}
                 className={`p-4 ${preferences.darkMode ? 'bg-rose-950/20' : 'bg-rose-50/50'} rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-rose-100/20 transition-colors`}
               >
                 <LogOut size={18} className="text-rose-400" />
                 <span className={`text-[8px] font-black uppercase tracking-widest text-rose-500 text-center`}>Salir</span>
               </button>
            </div>
          </div>
        );
      case 'circles':
        return <FriendsView darkMode={preferences.darkMode} />;
      default:
        return null;
    }
  };

  const lightTheme = {
    bg: 'bg-slate-50',
    card: 'bg-white',
    cardSecondary: 'bg-bento-bg',
    text: 'text-slate-900',
    textTitle: 'text-deep-teal',
    textMuted: 'text-slate-500',
    itemBg: 'bg-slate-100',
    border: 'border-slate-100',
    shadow: 'shadow-xl shadow-black/[0.02]',
    modalBg: 'bg-white',
    inputBg: 'bg-slate-50'
  };

  const darkTheme = {
    bg: 'bg-slate-950',
    card: 'bg-slate-900',
    cardSecondary: 'bg-slate-800',
    text: 'text-slate-100',
    textTitle: 'text-white',
    textMuted: 'text-slate-400',
    itemBg: 'bg-slate-800',
    border: 'border-slate-800/50',
    shadow: 'shadow-xl shadow-black/[0.2]',
    modalBg: 'bg-slate-900',
    inputBg: 'bg-slate-800'
  };

  const theme = preferences.darkMode ? darkTheme : lightTheme;

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="relative">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-24 h-24 rounded-[2.5rem] mx-auto overflow-hidden shadow-2xl shadow-sunset-orange/20"
            >
              <img src="/KAIROS_LOGO.png" alt="Kairos" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-sunset-orange blur-3xl opacity-20 -z-10" 
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-sunset-wine tracking-tighter uppercase">Kairos</h1>
            <p className="text-[10px] font-black text-sunset-wine/30 uppercase tracking-[0.3em]">Sincronizando con tu tiempo</p>
          </div>
          <div className="flex justify-center gap-1.5">
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-sunset-orange" />
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-sunset-orange" />
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-sunset-orange" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-start">
        {isQuotaExceeded && (
          <div className="bg-amber-600 text-white px-4 py-3 text-center text-[11px] font-black leading-relaxed shadow-lg z-[200] flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2 border-b border-amber-700/50 animate-fade-in">
            <span>⚠️ <strong>LÍMITE DE CUOTA DE FIRESTORE EXCEDIDO:</strong> La cuota se reiniciará el día de mañana. Encontrará información de límites detallada en la sección <em>Enterprise edition</em> bajo la columna del plan <em>Spark</em> de <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200">Precios de Firebase</a>. Tu progreso se guardará en almacenamiento local de respaldo.</span>
            <div className="flex gap-2">
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0677286701/firestore/databases/ai-studio-2ffff3d8-ae33-4071-a643-d10fe2c2e40e/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-100 flex items-center gap-1 font-black whitespace-nowrap bg-white/20 px-2 py-1 rounded shadow-sm text-[10px]"
              >
                Ver Mi Base de Datos ↗
              </a>
              <a
                href="https://firebase.google.com/pricing#cloud-firestore"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-100 flex items-center gap-1 font-black whitespace-nowrap bg-white/20 px-2 py-1 rounded shadow-sm text-[10px]"
              >
                Precios de Firebase ↗
              </a>
            </div>
          </div>
        )}
        <div className="flex-1">
          <AuthScreen darkMode={preferences.darkMode} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      {isQuotaExceeded && (
        <div className="bg-amber-600 text-white px-4 py-3 text-center text-[11px] font-black leading-relaxed shadow-lg z-[200] relative flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2 border-b border-amber-700/50">
          <span>⚠️ <strong>LÍMITE DE CUOTA DE FIRESTORE EXCEDIDO:</strong> La cuota se reiniciará el día de mañana. Encontrará información de límites detallada en la sección <em>Enterprise edition</em> bajo la columna del plan <em>Spark</em> de <a href="https://firebase.google.com/pricing#cloud-firestore" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-200">Precios de Firebase</a>. Activamos el modo seguro de almacenamiento local fallback (tus tareas y hábitos se guardarán en tu navegador).</span>
          <div className="flex gap-2">
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0677286701/firestore/databases/ai-studio-2ffff3d8-ae33-4071-a643-d10fe2c2e40e/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-100 flex items-center gap-1 font-black whitespace-nowrap bg-white/20 px-2 py-1 rounded shadow-sm text-[10px]"
            >
              Ver Mi Base de Datos ↗
            </a>
            <a
              href="https://firebase.google.com/pricing#cloud-firestore"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-amber-100 flex items-center gap-1 font-black whitespace-nowrap bg-white/20 px-2 py-1 rounded shadow-sm text-[10px]"
            >
              Precios de Firebase ↗
            </a>
          </div>
        </div>
      )}
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-wellness/5 rounded-full blur-3xl" />

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTaskModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-6 shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Nueva Tarea</h2>
                <button 
                  onClick={() => setIsTaskCategoryModalOpen(true)}
                  className={`p-2 ${theme.itemBg} ${theme.textMuted} rounded-xl hover:bg-primary/10 hover:text-primary transition-colors`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Título</label>
                  <input type="text" placeholder="Ej: Estudiar React" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Categoría</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar">
                    {taskCategories.map((cat) => (
                      <button key={cat.id} onClick={() => setNewTask({...newTask, category: cat.id})} className={`p-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${newTask.category === cat.id ? 'bg-primary text-white border-primary' : `${theme.card} ${theme.textMuted} ${theme.border}`}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsTaskModalOpen(false)} className={`flex-1 p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl`}>Cancelar</button>
                  <button onClick={() => {
                    if (!newTask.title) return;
                    SocialService.saveTask({ title: newTask.title, completed: false, category: newTask.category });
                    setIsTaskModalOpen(false);
                    setNewTask({ title: '', category: taskCategories[0]?.id || 'work' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEventModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-6 shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Nuevo Evento</h2>
                <button 
                  onClick={() => setIsEventCategoryModalOpen(true)}
                  className={`p-2 ${theme.itemBg} ${theme.textMuted} rounded-xl hover:bg-primary/10 hover:text-primary transition-colors`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Título</label>
                  <input type="text" placeholder="Ej: Reunión" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-sunset-wine/40 uppercase tracking-widest">Inicio</label>
                    <input type="time" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none`} value={newEvent.startTime} onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-sunset-wine/40 uppercase tracking-widest">Fin</label>
                    <input type="time" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none`} value={newEvent.endTime} onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ubicación</label>
                  <input type="text" placeholder="Ej: Zoom o Oficina" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none`} value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoría</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar">
                    {eventCategories.map((cat) => (
                      <button key={cat.id} onClick={() => setNewEvent({...newEvent, type: cat.id})} className={`p-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${newEvent.type === cat.id ? 'bg-primary text-white border-primary' : `${theme.card} ${theme.textMuted} ${theme.border}`}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsEventModalOpen(false)} className={`flex-1 p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl`}>Cancelar</button>
                  <button onClick={() => {
                    if (!newEvent.title) return;
                    setEvents([...events, { id: Date.now().toString(), ...newEvent }]);
                    setIsEventModalOpen(false);
                    setNewEvent({ title: '', startTime: '09:00', endTime: '10:00', location: '', type: eventCategories[0]?.id || 'work' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Location Modal */}
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLocationModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-6 shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Nueva Ubicación</h2>
                <button 
                  onClick={() => setIsLocationCategoryModalOpen(true)}
                  className={`p-2 ${theme.itemBg} ${theme.textMuted} rounded-xl hover:bg-primary/10 hover:text-primary transition-colors`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Nombre</label>
                  <input type="text" placeholder="Ej: Biblioteca" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newLocation.name} onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Horas estimadas</label>
                  <input type="number" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newLocation.time} onChange={(e) => setNewLocation({...newLocation, time: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Categoría</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar">
                    {locationCategories.map((cat) => (
                      <button key={cat.id} onClick={() => setNewLocation({...newLocation, category: cat.id})} className={`p-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${newLocation.category === cat.id ? 'bg-primary text-white border-primary' : `${theme.card} ${theme.textMuted} ${theme.border}`}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsLocationModalOpen(false)} className={`flex-1 p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl`}>Cancelar</button>
                  <button onClick={() => {
                    if (!newLocation.name) return;
                    setLocations([...locations, { id: Date.now().toString(), ...newLocation }]);
                    setIsLocationModalOpen(false);
                    setNewLocation({ name: '', time: 0, category: locationCategories[0]?.id || 'home' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Routine Modal */}
      <AnimatePresence>
        {isRoutineModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoutineModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-6 shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Nueva Rutina</h2>
                <button 
                  onClick={() => setIsRoutineCategoryModalOpen(true)}
                  className={`p-2 ${theme.itemBg} ${theme.textMuted} rounded-xl hover:bg-primary/10 hover:text-primary transition-colors`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Actividad</label>
                  <input type="text" placeholder="Ej: Meditación" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newRoutine.activity} onChange={(e) => setNewRoutine({...newRoutine, activity: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Hora</label>
                  <input type="time" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newRoutine.time} onChange={(e) => setNewRoutine({...newRoutine, time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Categoría</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto no-scrollbar">
                    {routineCategories.map((cat) => (
                      <button key={cat.id} onClick={() => setNewRoutine({...newRoutine, type: cat.id})} className={`p-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${newRoutine.type === cat.id ? 'bg-primary text-white border-primary' : `${theme.card} ${theme.textMuted} ${theme.border}`}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsRoutineModalOpen(false)} className={`flex-1 p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl`}>Cancelar</button>
                  <button onClick={() => {
                    if (!newRoutine.activity) return;
                    SocialService.saveHabit({ ...newRoutine, completed: false, group: 'routine' });
                    setIsRoutineModalOpen(false);
                    setNewRoutine({ time: '07:00', activity: '', type: routineCategories[0]?.id || 'rest' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alarm Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} rounded-3xl p-6 shadow-2xl transition-colors duration-300`}>
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Nueva Categoría de Alarma</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Nombre</label>
                  <input type="text" placeholder="Ej: Ejercicio" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['indigo', 'emerald', 'rose', 'amber', 'cyan', 'purple', 'orange', 'slate'].map((color) => (
                      <button key={color} onClick={() => setNewCategory({...newCategory, color})} className={`w-8 h-8 rounded-full border-2 transition-all ${newCategory.color === color ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: color === 'indigo' ? '#4F46E5' : color === 'emerald' ? '#10B981' : color === 'rose' ? '#F43F5E' : color === 'amber' ? '#F59E0B' : color === 'cyan' ? '#06B6D4' : color === 'purple' ? '#8B5CF6' : color === 'orange' ? '#F97316' : '#64748B' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsCategoryModalOpen(false)} className={`flex-1 p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl`}>Cancelar</button>
                  <button onClick={() => {
                    if (!newCategory.name) return;
                    setCategories([...categories, { id: Date.now().toString(), name: newCategory.name, icon: 'zap', color: newCategory.color }]);
                    setIsCategoryModalOpen(false);
                    setNewCategory({ name: '', color: 'indigo' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Crear</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Category Modal */}
      <AnimatePresence>
        {isTaskCategoryModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTaskCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} rounded-3xl p-6 shadow-2xl transition-colors duration-300`}>
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Nueva Categoría de Tarea</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Nombre</label>
                  <input type="text" placeholder="Ej: Trabajo" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['indigo', 'emerald', 'rose', 'amber', 'cyan', 'purple', 'orange', 'slate'].map((color) => (
                      <button key={color} onClick={() => setNewCategory({...newCategory, color})} className={`w-8 h-8 rounded-full border-2 transition-all ${newCategory.color === color ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: color === 'indigo' ? '#4F46E5' : color === 'emerald' ? '#10B981' : color === 'rose' ? '#F43F5E' : color === 'amber' ? '#F59E0B' : color === 'cyan' ? '#06B6D4' : color === 'purple' ? '#8B5CF6' : color === 'orange' ? '#F97316' : '#64748B' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsTaskCategoryModalOpen(false)} className="flex-1 p-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancelar</button>
                  <button onClick={() => {
                    if (!newCategory.name) return;
                    setTaskCategories([...taskCategories, { id: Date.now().toString(), name: newCategory.name, icon: 'zap', color: newCategory.color }]);
                    setIsTaskCategoryModalOpen(false);
                    setNewCategory({ name: '', color: 'indigo' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Crear</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Category Modal */}
      <AnimatePresence>
        {isEventCategoryModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEventCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} rounded-3xl p-6 shadow-2xl transition-colors duration-300`}>
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Nueva Categoría de Evento</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Nombre</label>
                  <input type="text" placeholder="Ej: Reunión" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['indigo', 'emerald', 'rose', 'amber', 'cyan', 'purple', 'orange', 'slate'].map((color) => (
                      <button key={color} onClick={() => setNewCategory({...newCategory, color})} className={`w-8 h-8 rounded-full border-2 transition-all ${newCategory.color === color ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: color === 'indigo' ? '#4F46E5' : color === 'emerald' ? '#10B981' : color === 'rose' ? '#F43F5E' : color === 'amber' ? '#F59E0B' : color === 'cyan' ? '#06B6D4' : color === 'purple' ? '#8B5CF6' : color === 'orange' ? '#F97316' : '#64748B' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsEventCategoryModalOpen(false)} className="flex-1 p-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancelar</button>
                  <button onClick={() => {
                    if (!newCategory.name) return;
                    setEventCategories([...eventCategories, { id: Date.now().toString(), name: newCategory.name, icon: 'zap', color: newCategory.color }]);
                    setIsEventCategoryModalOpen(false);
                    setNewCategory({ name: '', color: 'indigo' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Crear</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Location Category Modal */}
      <AnimatePresence>
        {isLocationCategoryModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLocationCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} rounded-3xl p-6 shadow-2xl transition-colors duration-300`}>
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Nueva Categoría de Ubicación</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Nombre</label>
                  <input type="text" placeholder="Ej: Trabajo" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['indigo', 'emerald', 'rose', 'amber', 'cyan', 'purple', 'orange', 'slate'].map((color) => (
                      <button key={color} onClick={() => setNewCategory({...newCategory, color})} className={`w-8 h-8 rounded-full border-2 transition-all ${newCategory.color === color ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: color === 'indigo' ? '#4F46E5' : color === 'emerald' ? '#10B981' : color === 'rose' ? '#F43F5E' : color === 'amber' ? '#F59E0B' : color === 'cyan' ? '#06B6D4' : color === 'purple' ? '#8B5CF6' : color === 'orange' ? '#F97316' : '#64748B' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsLocationCategoryModalOpen(false)} className="flex-1 p-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancelar</button>
                  <button onClick={() => {
                    if (!newCategory.name) return;
                    setLocationCategories([...locationCategories, { id: Date.now().toString(), name: newCategory.name, icon: 'zap', color: newCategory.color }]);
                    setIsLocationCategoryModalOpen(false);
                    setNewCategory({ name: '', color: 'indigo' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Crear</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Routine Category Modal */}
      <AnimatePresence>
        {isRoutineCategoryModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoutineCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`relative w-full max-w-sm ${theme.modalBg} rounded-3xl p-6 shadow-2xl transition-colors duration-300`}>
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Nueva Categoría de Rutina</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Nombre</label>
                  <input type="text" placeholder="Ej: Ejercicio" className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`} value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['indigo', 'emerald', 'rose', 'amber', 'cyan', 'purple', 'orange', 'slate'].map((color) => (
                      <button key={color} onClick={() => setNewCategory({...newCategory, color})} className={`w-8 h-8 rounded-full border-2 transition-all ${newCategory.color === color ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: color === 'indigo' ? '#4F46E5' : color === 'emerald' ? '#10B981' : color === 'rose' ? '#F43F5E' : color === 'amber' ? '#F59E0B' : color === 'cyan' ? '#06B6D4' : color === 'purple' ? '#8B5CF6' : color === 'orange' ? '#F97316' : '#64748B' }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsRoutineCategoryModalOpen(false)} className="flex-1 p-4 bg-slate-100 text-slate-600 font-bold rounded-2xl">Cancelar</button>
                  <button onClick={() => {
                    if (!newCategory.name) return;
                    setRoutineCategories([...routineCategories, { id: Date.now().toString(), name: newCategory.name, icon: 'zap', color: newCategory.color }]);
                    setIsRoutineCategoryModalOpen(false);
                    setNewCategory({ name: '', color: 'indigo' });
                  }} className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">Crear</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Notifications Modal */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-20">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-6 shadow-2xl transition-colors duration-300`}
            >
              <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
                <h2 className={`text-xl font-bold ${theme.textTitle}`}>Notificaciones</h2>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const updated = notifications.map(n => ({ ...n, read: true }));
                      setNotifications(updated);
                    }}
                    className="text-xs font-bold text-primary uppercase tracking-wider hover:text-primary/80 transition-colors"
                  >
                    Leer todas
                  </button>
                  <button 
                    onClick={() => setNotifications([])}
                    className="text-xs font-bold text-rose-500 uppercase tracking-wider hover:text-rose-600 transition-colors"
                  >
                    Borrar
                  </button>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-4 border-b ${theme.border} flex gap-3 transition-colors ${!n.read ? 'bg-primary/10' : ''}`}>
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${theme.textTitle}`}>{n.title}</p>
                        <p className={`text-sm ${theme.textMuted} mt-0.5`}>{n.message}</p>
                        <p className={`text-[10px] ${theme.textMuted} mt-2 font-medium uppercase opacity-50`}>{n.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Bell size={40} className={`mx-auto ${theme.textMuted} mb-4 opacity-20`} />
                    <p className={`${theme.textMuted} font-medium`}>No tienes notificaciones</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className={`w-full p-4 text-center text-sm font-bold ${theme.textMuted} ${theme.itemBg} hover:opacity-80 transition-opacity`}
              >
                Cerrar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`${theme.modalBg} w-full max-w-md rounded-3xl md:rounded-[3rem] overflow-hidden relative z-10 shadow-2xl transition-colors duration-300 max-h-[90vh] overflow-y-auto no-scrollbar`}
            >
              <div className="bg-sunset-pink py-8 px-5 xs:p-12 text-white flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className={`w-32 h-32 rounded-[2.5rem] ${theme.itemBg} p-1.5 shadow-2xl relative overflow-hidden`}>
                    <img 
                      src={userProfile.photo} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-[2rem]"
                    />
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center cursor-pointer shadow-xl border-4 border-sunset-pink hover:scale-110 transition-transform">
                    <Edit2 size={16} className="text-white" />
                    <input type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                  </label>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tight tracking-tight">{userProfile.name}</h2>
                  <p className="text-white/60 font-medium">{userProfile.email}</p>
                </div>
              </div>

              <div className="p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className={`${theme.itemBg} p-6 rounded-[2rem] flex flex-col items-center gap-2 transition-colors`}>
                      <Zap size={24} className="text-sunset-orange" fill="currentColor" />
                      <div className="text-center">
                         <p className={`text-xl font-black ${theme.textTitle}`}>{streak}</p>
                         <p className={`text-[9px] font-black uppercase tracking-widest ${theme.textMuted}`}>Racha</p>
                      </div>
                   </div>
                   <div className={`${theme.itemBg} p-6 rounded-[2rem] flex flex-col items-center gap-2 transition-colors`}>
                      <Clock size={24} className="text-deep-teal" fill="currentColor" />
                      <div className="text-center">
                         <p className={`text-xl font-black ${theme.textTitle}`}>{balance}%</p>
                         <p className={`text-[9px] font-black uppercase tracking-widest ${theme.textMuted}`}>Esencia</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                  <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-colors">Configuración</button>
                  <button 
                    onClick={() => signOut(auth)}
                    className={`w-full ${theme.itemBg} ${theme.textMuted} py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-80 transition-all`}
                   >
                    Cerrar Sesión
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-white/50 hover:bg-black/20"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {isPreferencesOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreferencesOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} rounded-3xl p-6 shadow-2xl`}
            >
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Preferencias</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${theme.textTitle}`}>Modo Oscuro</p>
                      <p className={`text-xs ${theme.textMuted}`}>{preferences.darkMode ? 'Activado' : 'Desactivado'}</p>
                    </div>
                    <button 
                      onClick={() => setPreferences({...preferences, darkMode: !preferences.darkMode})}
                      className={`w-12 h-6 rounded-full relative transition-colors ${preferences.darkMode ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <motion.div 
                        animate={{ x: preferences.darkMode ? 24 : 2 }}
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${theme.textTitle}`}>Notificaciones Push</p>
                      <p className={`text-xs ${theme.textMuted}`}>{preferences.pushNotifications ? 'Activado' : 'Desactivado'}</p>
                    </div>
                    <button 
                      onClick={() => setPreferences({...preferences, pushNotifications: !preferences.pushNotifications})}
                      className={`w-12 h-6 rounded-full relative transition-colors ${preferences.pushNotifications ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <motion.div 
                        animate={{ x: preferences.pushNotifications ? 24 : 2 }}
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${theme.textTitle}`}>Sonido de Alarma</p>
                      <p className={`text-xs ${theme.textMuted}`}>{preferences.alarmSound}</p>
                    </div>
                    <select 
                      value={preferences.alarmSound}
                      onChange={(e) => setPreferences({...preferences, alarmSound: e.target.value})}
                      className={`text-xs font-bold text-primary bg-transparent focus:outline-none ${preferences.darkMode ? 'bg-slate-800' : ''}`}
                    >
                      <option value="Zen">Zen</option>
                      <option value="Energía">Energía</option>
                      <option value="Suave">Suave</option>
                      <option value="Clásico">Clásico</option>
                    </select>
                  </div>

                  {/* PWA Installation Option */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-3">
                    {deferredPrompt ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${theme.textTitle}`}>Instalar Kairos</p>
                          <p className={`text-xs ${theme.textMuted}`}>Disfruta como app nativa</p>
                        </div>
                        <button 
                          onClick={installApp}
                          className="px-4 py-2 bg-primary text-white font-black rounded-xl text-xs hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-wider"
                        >
                          Instalar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className={`text-[11px] font-bold ${theme.textTitle}`}>📱 Instalar en tu móvil o PC</p>
                        <p className={`text-[10px] ${theme.textMuted} leading-relaxed`}>
                          En Android/PC, búscalo en el menú del navegador. En iPhone/Safari, pulsa <strong className="text-primary font-extrabold">Compartir</strong> y elige <strong className="text-primary font-extrabold">Añadir a pantalla de inicio</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreferencesOpen(false)}
                  className={`w-full p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl`}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {isDeleteAccountOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteAccountOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} rounded-[2.5rem] p-8 shadow-2xl z-10`}
            >
              <h2 className="text-2xl font-black mb-4 text-red-500 flex items-center gap-2">
                <Trash2 size={24} />
                ¿Estás seguro?
              </h2>
              <p className={`text-sm ${theme.textMuted} leading-relaxed mb-6`}>
                Esta acción eliminará tu cuenta y todos tus datos permanentemente. No se puede deshacer.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  disabled={isDeletingAccount}
                  onClick={async () => {
                    await handleDeleteAccount();
                    setIsDeleteAccountOpen(false);
                  }}
                  className="w-full p-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800/80 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {isDeletingAccount ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    'Eliminar todo'
                  )}
                </button>
                <button 
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteAccountOpen(false)}
                  className={`w-full p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl transition-all text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Custom Quick Habit Modal */}
      <AnimatePresence>
        {isAddQuickHabitOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddQuickHabitOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} rounded-[2.5rem] p-8 shadow-2xl z-10`}
            >
              <h2 className={`text-2xl font-black mb-4 ${theme.textTitle} flex items-center gap-2`}>
                <Plus size={24} className="text-deep-teal" />
                Nuevo Hábito Rápido
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted} block mb-2`}>
                    Nombre del hábito
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Meditar, Gym, Correr..."
                    value={newQuickHabitName}
                    onChange={(e) => setNewQuickHabitName(e.target.value)}
                    className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-deep-teal/20 transition-all ${theme.text}`}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    if (!newQuickHabitName.trim()) return;
                    const name = newQuickHabitName.trim();
                    const normalized = name.toLowerCase();
                    let matchedType = 'custom';
                    if (/agua|hidrat|water/.test(normalized)) matchedType = 'water';
                    else if (/comida|comer|almuerz|desayun|cena/.test(normalized)) matchedType = 'food';
                    else if (/dormir|sueño|descanso|relax|noche/.test(normalized)) matchedType = 'rest';
                    else if (/medicina|vitamina|pastilla|pill/.test(normalized)) matchedType = 'medicine';
                    else if (/ejercicio|gym|correr|deporte|entrena/.test(normalized)) matchedType = 'exercise';
                    else if (/meditar|meditación|zen|respira/.test(normalized)) matchedType = 'zen';

                    const newH: any = {
                      label: name,
                      type: matchedType,
                      time: currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0'),
                      completed: false,
                      group: 'quickHabit'
                    };
                    await SocialService.saveHabit(newH);
                    setIsAddQuickHabitOpen(false);
                    setNewQuickHabitName('');
                  }}
                  className="w-full p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all text-sm uppercase tracking-wider"
                >
                  Guardar
                </button>
                <button 
                  onClick={() => setIsAddQuickHabitOpen(false)}
                  className={`w-full p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl transition-all text-sm uppercase tracking-wider`}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAboutOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} rounded-[2.5rem] p-8 shadow-2xl overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-full h-2 sunset-gradient" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-sunset-orange/20">
                  <img src="/KAIROS_LOGO.png" alt="Kairos" className="w-full h-full object-cover" />
                </div>
                
                <div className="space-y-2">
                  <h2 className={`text-3xl font-black ${theme.textTitle} tracking-tight uppercase`}>Kairos</h2>
                  <p className="text-xs font-black text-sunset-orange tracking-[0.2em] uppercase">Tiempo con sentido</p>
                </div>
                
                <div className={`space-y-4 ${theme.textTitle} leading-relaxed`}>
                  <p className="text-sm font-medium">
                    Kairos no es solo una agenda, es una filosofía de vida. En la antigua Grecia, "Kairos" representaba el tiempo oportuno, el momento perfecto donde las cosas suceden.
                  </p>
                  <p className="text-sm">
                    Nuestra misión es ayudarte a encontrar ese equilibrio entre productividad y bienestar. Con la ayuda de tu guardián del tiempo y nuestra IA, buscamos que cada minuto cuente no por su cantidad, sino por su propósito.
                  </p>
                  <div className={`pt-4 border-t ${theme.border} w-full`}>
                    <p className={`text-[10px] font-bold ${theme.textMuted} tracking-widest uppercase mb-1`}>Creado para ti por</p>
                    <p className="text-sm font-black text-sunset-wine">Equipo Kairos</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="w-full py-4 sunset-gradient text-white font-bold rounded-2xl shadow-xl shadow-sunset-orange/20 transition-transform active:scale-95"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Consultation Modal */}
      <AnimatePresence>
        {isAiConsultationOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAiConsultationOpen(false);
                setConsultationResponse('');
                setActiveQueryType(null);
              }}
              className="absolute inset-0 bg-sunset-wine/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className={`relative w-full max-w-sm glass-card pt-16 pb-10 px-8 ${theme.modalBg} shadow-2xl border-none space-y-8 rounded-[4rem] overflow-visible`}
            >
              {/* Mascot Bubble - Floating prominently at top */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-32 h-32 sunset-gradient p-1.5 rounded-[3.5rem] shadow-2xl shadow-sunset-orange/20"
                >
                  <div className={`w-full h-full ${preferences.darkMode ? 'bg-slate-900' : 'bg-white'} rounded-[3.2rem] flex items-center justify-center overflow-hidden`}>
                    <div className="scale-[0.55]">
                      <TimeMascot streak={streak} balance={balance} />
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="text-center space-y-1 pt-4">
                <h3 className={`text-2xl font-black ${theme.textTitle} tracking-tight`}>
                  Consulta {mascotName}
                </h3>
                <p className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-[0.2em] opacity-50`}>Sintonizando con tu tiempo</p>
              </div>

              <div className={`${theme.cardSecondary} rounded-[3rem] p-8 min-h-[160px] flex items-center justify-center text-center relative overflow-hidden transition-all duration-500`}>
                {/* Decorative background element for the response box */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sunset-orange/5 rounded-full blur-3xl" />
                <AnimatePresence mode="wait">
                  {isAiThinking ? (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="flex gap-2">
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-sunset-orange" />
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-sunset-orange" />
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-sunset-orange" />
                      </div>
                      <p className="text-[10px] font-black text-sunset-wine/30 uppercase tracking-[0.2em]">Analizando tu día...</p>
                    </motion.div>
                  ) : consultationResponse ? (
                    <motion.div
                      key="response"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative z-10"
                    >
                      <p className="text-[13px] font-black italic text-sunset-wine/70 leading-[1.6] tracking-tight">
                        "{consultationResponse}"
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="prompt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative z-10 w-full"
                    >
                      {activeQueryType === 'open' ? (
                        <div className="space-y-4">
                          <input 
                            type="text"
                            placeholder="Pregúntame lo que quieras..."
                            className={`w-full ${theme.inputBg} border-2 ${theme.border} p-5 rounded-[2rem] text-sm font-black ${theme.textTitle} placeholder:${theme.textMuted} focus:ring-4 focus:ring-sunset-orange/5 focus:border-sunset-orange/20 transition-all outline-none`}
                            value={userQuestion}
                            onChange={(e) => setUserQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && consultAI('open')}
                            autoFocus
                          />
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => consultAI('open')}
                            className="w-full sunset-gradient text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-[1.5rem] shadow-xl shadow-sunset-orange/20"
                          >
                            Consultar Ahora
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Users size={24} className="text-sunset-wine/5 mb-2" />
                          <p className="text-[10px] font-black text-sunset-wine/20 uppercase tracking-[0.3em] max-w-[150px]">
                            Selecciona un enfoque arriba
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => consultAI('why')}
                    className={`py-5 rounded-[2.2rem] flex flex-col items-center gap-2 transition-all group ${
                      activeQueryType === 'why' 
                        ? 'sunset-gradient text-white shadow-xl shadow-sunset-orange/20' 
                        : 'bg-rose-50 text-sunset-wine hover:bg-rose-100'
                    }`}
                  >
                    <HelpCircle size={16} className={activeQueryType === 'why' ? 'text-white' : 'text-sunset-orange'} />
                    <span className="text-[9px] font-black uppercase tracking-widest">¿Por qué?</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveQueryType('open')}
                    className={`py-5 rounded-[2.2rem] flex flex-col items-center gap-2 transition-all group ${
                      activeQueryType === 'open' 
                        ? 'sunset-gradient text-white shadow-xl shadow-sunset-orange/20' 
                        : 'bg-rose-50 text-sunset-wine hover:bg-rose-100'
                    }`}
                  >
                    <Search size={16} className={activeQueryType === 'open' ? 'text-white' : 'text-sunset-orange'} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Preguntar</span>
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'improve', label: 'Mejorar', icon: <TrendingUp size={16} /> },
                    { id: 'summary', label: 'Resumen', icon: <FileText size={16} /> }
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => consultAI(option.id as any)}
                      className={`flex flex-col items-center gap-2 py-5 rounded-[2.2rem] transition-all group ${
                        activeQueryType === option.id 
                          ? 'sunset-gradient text-white shadow-xl' 
                          : 'bg-rose-50 text-sunset-wine hover:bg-rose-100'
                      }`}
                    >
                      <div className={activeQueryType === option.id ? 'text-white' : 'text-sunset-orange'}>
                        {option.icon}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsAiConsultationOpen(false);
                  setConsultationResponse('');
                  setActiveQueryType(null);
                }}
                className="w-full text-[10px] font-black uppercase tracking-[0.4em] text-sunset-wine/20 py-2 hover:text-sunset-wine/40 transition-colors"
              >
                Cerrar Volver
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Habit Config Modal */}
      <AnimatePresence>
        {isHabitConfigOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHabitConfigOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-8 shadow-2xl`}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className={`text-2xl font-black ${theme.textTitle} tracking-tighter`}>Configurar Hábitos</h2>
                <button onClick={() => setIsHabitConfigOpen(false)} className="text-slate-400">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-3">
                {[
                  { type: 'water' as const, label: 'Agua', icon: <Droplets size={20} /> },
                  { type: 'food' as const, label: 'Comida', icon: <Utensils size={20} /> },
                  { type: 'rest' as const, label: 'Relax', icon: <Moon size={20} /> },
                  { type: 'medicine' as const, label: 'Zen', icon: <Pill size={20} /> },
                ].map((habit) => {
                  const isActive = enabledHabitTypes.includes(habit.type);
                  return (
                    <button
                      key={habit.type}
                      onClick={() => {
                        if (isActive) {
                          setEnabledHabitTypes(enabledHabitTypes.filter(t => t !== habit.type));
                        } else {
                          setEnabledHabitTypes([...enabledHabitTypes, habit.type]);
                        }
                      }}
                      className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                        isActive 
                          ? 'bg-deep-teal/5 border-deep-teal text-deep-teal' 
                          : `${theme.card} ${theme.border} ${theme.textMuted} hover:opacity-80`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={isActive ? 'text-deep-teal' : 'text-slate-300'}>
                          {habit.icon}
                        </div>
                        <span className="font-black uppercase text-[10px] tracking-widest">{habit.label}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-deep-teal text-white' : 'bg-slate-100 text-slate-300'
                      }`}>
                        {isActive ? <Check size={14} strokeWidth={4} /> : <Plus size={14} strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setIsHabitConfigOpen(false)}
                className="w-full mt-8 p-4 bg-deep-teal text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-deep-teal/20"
              >
                Hecho
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wellness Modal */}
      <AnimatePresence>
        {isWellnessModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWellnessModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-6 shadow-2xl`}
            >
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Nuevo Recordatorio</h2>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Actividad</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Beber 2 vasos de agua"
                    className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness/20 transition-all ${theme.text}`}
                    value={newWellness.label}
                    onChange={(e) => setNewWellness({...newWellness, label: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'water', label: 'Agua', icon: <Droplets size={18} /> },
                      { id: 'food', label: 'Comida', icon: <Coffee size={18} /> },
                      { id: 'sleep', label: 'Sueño', icon: <Moon size={18} /> },
                      { id: 'rest', label: 'Descanso', icon: <Heart size={18} /> }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setNewWellness({...newWellness, type: t.id as any})}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                          newWellness.type === t.id 
                            ? 'bg-wellness text-white border-wellness shadow-md' 
                            : `${theme.itemBg} ${theme.textMuted} ${theme.border}`
                        }`}
                      >
                        {t.icon}
                        <span className="text-xs font-bold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Hora</label>
                  <input 
                    type="time" 
                    className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-wellness/20 transition-all ${theme.text}`}
                    value={newWellness.time}
                    onChange={(e) => setNewWellness({...newWellness, time: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsWellnessModalOpen(false)}
                    className={`flex-1 p-4 ${theme.itemBg} ${theme.textMuted} font-bold rounded-2xl`}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (!newWellness.label) return;
                      SocialService.saveHabit({ ...newWellness, completed: false, group: 'wellness' });
                      setIsWellnessModalOpen(false);
                      setNewWellness({ type: 'water', label: '', time: '10:00' });
                    }}
                    className="flex-1 p-4 bg-wellness text-white font-bold rounded-2xl shadow-lg shadow-wellness/20"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alarm Modal */}
      <AnimatePresence>
        {isAlarmModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAlarmModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.modalBg} ${theme.text} rounded-3xl p-6 shadow-2xl`}
            >
              <h2 className={`text-2xl font-bold mb-6 ${theme.textTitle}`}>Nueva Alarma</h2>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Nombre</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Tomar Vitamina"
                    className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`}
                    value={newAlarm.title}
                    onChange={(e) => setNewAlarm({...newAlarm, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Hora</label>
                  <input 
                    type="time" 
                    className={`w-full p-4 ${theme.inputBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${theme.text}`}
                    value={newAlarm.time}
                    onChange={(e) => setNewAlarm({...newAlarm, time: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`text-xs font-bold ${theme.textMuted} uppercase tracking-widest`}>Categoría</label>
                    <button 
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-xs font-bold text-primary flex items-center gap-1"
                    >
                      <Plus size={12} /> Añadir
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto no-scrollbar p-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewAlarm({...newAlarm, category: cat.id})}
                        className={`p-2 text-[10px] font-bold uppercase rounded-xl border transition-all ${
                          newAlarm.category === cat.id 
                            ? 'bg-primary text-white border-primary' 
                            : `${theme.itemBg} ${theme.textMuted} ${theme.border}`
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsAlarmModalOpen(false)}
                    className="flex-1 p-4 bg-slate-100 text-slate-600 font-bold rounded-2xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (!newAlarm.title) return;
                      const alarm: Alarm = {
                        id: Date.now().toString(),
                        title: newAlarm.title,
                        time: newAlarm.time,
                        category: newAlarm.category,
                        enabled: true,
                        days: ['Todos']
                      };
                      SocialService.saveAlarm(alarm);
                      setIsAlarmModalOpen(false);
                      setNewAlarm({ title: '', time: '08:00', category: 'meal' });
                    }}
                    className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mascot Rename Modal */}
      <AnimatePresence>
        {isMascotRenameOpen && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMascotRenameOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm p-10 ${theme.modalBg} ${theme.text} shadow-2xl space-y-8 rounded-[4rem] border ${theme.border}`}
            >
              <div className="text-center space-y-4 pt-4">
                <div className="w-20 h-20 sunset-gradient rounded-[2.5rem] mx-auto flex items-center justify-center shadow-xl shadow-sunset-orange/20 mb-4">
                  <div className="scale-50">
                    <TimeMascot streak={streak} balance={balance} />
                  </div>
                </div>
                <h3 className={`text-3xl font-black ${theme.textTitle} tracking-tight leading-none italic`}>Vínculo Vital</h3>
                <p className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-[0.3em]`}>Nombra a tu guardián</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="Nombre de tu mascota..."
                  className={`w-full p-6 ${theme.inputBg} border-2 ${theme.border} rounded-[2.5rem] font-black ${theme.textTitle} placeholder:${theme.textMuted} focus:ring-4 focus:ring-sunset-orange/10 transition-all outline-none text-center`}
                  value={mascotName}
                  onChange={(e) => setMascotName(e.target.value)}
                  autoFocus
                />
                
                <button 
                  onClick={() => setIsMascotRenameOpen(false)}
                  className="w-full py-6 sunset-gradient text-white font-black rounded-[2.5rem] shadow-xl shadow-sunset-orange/20 transition-transform active:scale-95 uppercase tracking-widest text-xs"
                >
                  Confirmar Nombre
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 md:ml-64">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── SIDEBAR DESKTOP ──────────────────────────────────── */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-screen w-64 z-50 flex-col justify-between py-8 px-4 ${preferences.darkMode ? 'bg-slate-900/95 border-r border-white/5' : 'bg-deep-teal/95 border-r border-white/5'} backdrop-blur-2xl shadow-2xl`}>
        <div className="px-4 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg">
              <img src="/KAIROS_LOGO.png" alt="Kairos" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-black italic tracking-tight text-white">Kairos</span>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'tasks', icon: <CheckSquare size={20} />, label: 'Metas' },
              { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Centro' },
              { id: 'alarms', icon: <AlarmClock size={20} />, label: 'Alarmas' },
              { id: 'circles', icon: <Users size={20} />, label: 'Social' },
              { id: 'stats', icon: <User size={20} />, label: 'Tú' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-deep-teal shadow-lg font-black'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5 font-bold'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm uppercase tracking-widest">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
                </motion.button>
              );
            })}
          </nav>
        </div>
        <div className="px-4 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsChatOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#ff6b6b] to-sunset-orange text-white shadow-lg"
          >
            <Sparkles size={18} className="animate-pulse" />
            <span className="text-sm font-black uppercase tracking-widest">Kairo IA</span>
          </motion.button>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <img src={userProfile.photo} alt="P" className="w-8 h-8 rounded-xl object-cover border border-white/20" />
            <div className="text-left min-w-0">
              <p className="text-white text-xs font-black truncate">{userProfile.name.split(' ')[0]}</p>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Racha #{streak}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* ── NAV INFERIOR MÓVIL ───────────────────────────────── */}
      {/* Barra de navegación inferior - solo móvil */}
      <nav
        style={{ position: 'fixed', bottom: '8px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: '100%', maxWidth: '420px', padding: '0 16px' }}
        className="md:hidden"
      >
        <div className={`${preferences.darkMode ? 'bg-slate-900/95' : 'bg-deep-teal/95'} backdrop-blur-2xl p-2.5 rounded-[3.5rem] flex items-center justify-around gap-1 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)] border border-white/5`}>
          {[
            { id: 'tasks', icon: <CheckSquare size={22} />, label: 'Metas' },
            { id: 'dashboard', icon: <LayoutDashboard size={22} />, label: 'Centro' },
            { id: 'alarms', icon: <AlarmClock size={22} />, label: 'Alarmas' },
            { id: 'circles', icon: <Users size={22} />, label: 'Social' },
            { id: 'stats', icon: <User size={22} />, label: 'Tú' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                layout
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center justify-center gap-2 h-14 rounded-full transition-all duration-500 overflow-hidden ${
                  isActive
                    ? `${theme.card} ${preferences.darkMode ? 'text-white' : 'text-deep-teal'} px-6 flex-grow shadow-lg z-10`
                    : 'text-white/30 hover:text-white/60 px-4'
                }`}
              >
                <div className="relative z-10">{item.icon}</div>
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      className="text-[11px] font-black uppercase tracking-widest leading-none mt-0.5 whitespace-nowrap relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-bg-mobile"
                    className="absolute inset-0 bg-white"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Floating Kairo AI Chat Button */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-28 right-4 md:hidden z-[100] w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff6b6b] to-sunset-orange text-white shadow-lg flex items-center justify-center cursor-pointer border border-white/20"
          id="kairo-chat-toggle"
        >
          <Sparkles size={24} className="animate-pulse" />
        </motion.button>
      )}

      {/* Kairo AI Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              id="kairo-chat-backdrop"
            />
            {/* Chat Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className={`relative w-full max-w-sm h-[500px] ${preferences.darkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white/95 border-slate-100'} backdrop-blur-3xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border`}
              id="kairo-chat-container"
            >
              {/* Header */}
              <div className={`p-5 flex items-center justify-between border-b ${preferences.darkMode ? 'border-white/5 bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MiniKairoIcon balance={balance} />
                    <span className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 bg-mint rounded-full border border-white" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-black ${theme.textTitle} tracking-tight`}>{mascotName}</h3>
                    <p className="text-[9px] text-mint font-black uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-mint animate-ping" />
                      Guía del Tiempo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className={`p-2 rounded-xl transition-all ${preferences.darkMode ? 'hover:bg-white/5 text-white/45 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                  id="close-chat-btn"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Message List */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar flex flex-col">
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      {/* Mascot avatar on left side (for Kairo) */}
                      {!isUser && (
                        <div className="flex-shrink-0 self-end mb-1">
                          <MiniKairoIcon balance={balance} />
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-tr from-[#ff6b6b] to-sunset-orange text-white rounded-br-none font-medium shadow-md md:rounded-br-sm'
                            : preferences.darkMode
                            ? 'bg-slate-900/90 text-white rounded-bl-none border border-white/5 md:rounded-bl-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50 md:rounded-bl-sm'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isChatTyping && (
                  <div className="flex items-end gap-2 max-w-[85%] self-start">
                    <div className="flex-shrink-0 self-end mb-1">
                      <MiniKairoIcon balance={balance} />
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl rounded-bl-none flex items-center gap-1.5 ${
                        preferences.darkMode ? 'bg-slate-900/90' : 'bg-slate-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Form Footer */}
              <form
                onSubmit={handleSendChatMessage}
                className={`p-3 border-t flex items-center gap-2 ${
                  preferences.darkMode ? 'border-white/5 bg-slate-900/10' : 'border-slate-100 bg-slate-50/50'
                }`}
              >
                <input
                  type="text"
                  placeholder={`Escribe un mensaje a ${mascotName}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatTyping}
                  className={`flex-grow p-3 text-xs rounded-xl border ${
                    preferences.darkMode
                      ? 'bg-slate-900 border-white/5 focus:ring-sunset-orange text-white'
                      : 'bg-white border-slate-200 focus:ring-[#ff6b6b]/40 text-slate-800'
                  } focus:outline-none focus:ring-2 transition-all disabled:opacity-50`}
                  id="chat-text-input"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatTyping}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#ff6b6b] to-sunset-orange text-white hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:scale-100 cursor-pointer"
                  id="chat-send-btn"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
