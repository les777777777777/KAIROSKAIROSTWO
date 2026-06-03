import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  terminate
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProfile {
  uid: string;
  kairosId: string;
  name: string;
  photoURL: string;
  mascotName: string;
  streak: number;
  balance: number;
  lastActive: any;
  habitsInitialized?: boolean;
}

export interface Interaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'well_done' | 'keep_going' | 'rest';
  timestamp: any;
}

// Auto-reset Firestore quota exceeded on a new day
const quotaDate = localStorage.getItem('kairo_firestore_quota_date');
const todayDate = new Date().toDateString();
if (quotaDate && quotaDate !== todayDate) {
  localStorage.removeItem('kairo_firestore_quota_exceeded');
  localStorage.removeItem('kairo_firestore_quota_date');
}

// Global state for quota tracking
export let isFirestoreQuotaExceededGlobal = localStorage.getItem('kairo_firestore_quota_exceeded') === 'true';

export function isQuotaExceededSync(): boolean {
  return isFirestoreQuotaExceededGlobal || localStorage.getItem('kairo_firestore_quota_exceeded') === 'true';
}

const quotaListeners = new Set<(status: boolean) => void>();
const activeFirestoreSubscriptions = new Set<() => void>();

export function subscribeToQuotaStatus(callback: (status: boolean) => void) {
  quotaListeners.add(callback);
  callback(isQuotaExceededSync());
  return () => {
    quotaListeners.delete(callback);
  };
}

export function triggerQuotaExceeded() {
  if (!isFirestoreQuotaExceededGlobal) {
    isFirestoreQuotaExceededGlobal = true;
    localStorage.setItem('kairo_firestore_quota_exceeded', 'true');
    localStorage.setItem('kairo_firestore_quota_date', new Date().toDateString());
    
    // Copy active subscriptions and unsubscribe all of them to stop Firebase background reconnect/backoff retries
    const subsToCancel = Array.from(activeFirestoreSubscriptions);
    activeFirestoreSubscriptions.clear();
    for (const cancelFn of subsToCancel) {
      try {
        cancelFn();
      } catch (err) {
        console.error("Error canceling active subscription upon quota exceeded:", err);
      }
    }

    try {
      terminate(db).catch(() => {});
    } catch (_) {}

    quotaListeners.forEach(cb => {
      try {
        cb(true);
      } catch (e) {
        console.error("Quota subscriber notification failed", e);
      }
    });
  }
}

export function isQuotaError(e: any): boolean {
  if (!e) return false;
  const msg = String(e.message || e).toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('resource-exhausted') ||
    msg.includes('resource_exhausted') ||
    msg.includes('limit exceeded') ||
    msg.includes('exhausted')
  );
}

// Local Storage Helper persistence
const getLocalData = (key: string, defaultVal: any = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const setLocalData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage write failed:", e);
  }
};

const localSubscribers: { [key: string]: Set<(data: any) => void> } = {
  tasks: new Set(),
  habits: new Set(),
  alarms: new Set(),
  events: new Set(),
  achievements: new Set(),
  progressHistory: new Set(),
  profile: new Set(),
  interactions: new Set(),
  friends: new Set(),
};

function notifyLocalSubscribers(key: string, data: any) {
  const subs = localSubscribers[key];
  if (subs) {
    subs.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`Error notifying local subscriber for ${key}:`, e);
      }
    });
  }
}

// Generic subscription helper using a bulletproof safe subscription manager
function safeOnSnapshot(
  queryOrRef: any,
  onNext: (snapshot: any) => void,
  onError: (error: any) => void
): () => void {
  if (isQuotaExceededSync()) {
    return () => {};
  }

  let unsub: (() => void) | null = null;
  let hasFailed = false;

  const wrapperOnError = (e: any) => {
    hasFailed = true;
    if (unsub) {
      try {
        unsub();
      } catch (_) {}
      activeFirestoreSubscriptions.delete(unsub);
    }
    onError(e);
  };

  try {
    const activeUnsub = onSnapshot(queryOrRef, onNext, wrapperOnError);
    unsub = activeUnsub;
    if (hasFailed) {
      try {
        activeUnsub();
      } catch (_) {}
    } else {
      activeFirestoreSubscriptions.add(activeUnsub);
    }
    return () => {
      try {
        activeUnsub();
      } catch (_) {}
      activeFirestoreSubscriptions.delete(activeUnsub);
    };
  } catch (err: any) {
    onError(err);
    return () => {};
  }
}

function subscribeCollection(
  colName: string,
  queryRef: any,
  localKey: string,
  callback: (data: any[]) => void
) {
  if (!localSubscribers[colName]) {
    localSubscribers[colName] = new Set();
  }
  localSubscribers[colName].add(callback);

  // Invoke immediately with local cache
  const localItems = getLocalData(localKey, []);
  callback(localItems);

  if (isQuotaExceededSync()) {
    return () => {
      localSubscribers[colName].delete(callback);
    };
  }

  const unsub = safeOnSnapshot(queryRef, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setLocalData(localKey, list);
    notifyLocalSubscribers(colName, list);
  }, (e) => {
    if (isQuotaError(e)) {
      triggerQuotaExceeded();
      callback(getLocalData(localKey, []));
    } else {
      console.error(`Firestore subscription error on ${colName}:`, e);
    }
  });

  return () => {
    unsub();
    localSubscribers[colName].delete(callback);
  };
}

// Variable matching safety gate for double initialization in a single session
let isInitializingDefaults = false;

export const SocialService = {
  // --- User Profile ---
  async syncProfile(profile: Partial<UserProfile>) {
    const user = auth.currentUser;
    if (!user) return;

    const localKey = `kairo_local_profile_${user.uid}`;
    let existingLocal = getLocalData(localKey, null);
    if (!existingLocal) {
      existingLocal = {
        uid: user.uid,
        kairosId: `@kairos_${Math.floor(1000 + Math.random() * 9000)}`,
        name: user.displayName || 'Usuario',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        mascotName: 'Kairo',
        streak: 0,
        balance: 0,
        lastActive: new Date().toISOString(),
        habitsInitialized: false,
      };
    }

    const updatedProfile = {
      ...existingLocal,
      ...profile,
      uid: user.uid,
      lastActive: new Date().toISOString(),
    };

    setLocalData(localKey, updatedProfile);
    notifyLocalSubscribers('profile', updatedProfile);

    if (isQuotaExceededSync()) {
      // Create local default assets if in local mode
      if (!updatedProfile.habitsInitialized && !isInitializingDefaults) {
        isInitializingDefaults = true;
        
        const localTasksKey = `kairo_local_tasks_${user.uid}`;
        const defaultTasks = [
          { id: 'local_t1', title: "Terminar proyecto pendiente", category: "work", completed: false, userId: user.uid },
          { id: 'local_t2', title: "Hacer ejercicio 30 min", category: "wellness", completed: false, userId: user.uid },
          { id: 'local_t3', title: "Leer 20 minutos", category: "personal", completed: false, userId: user.uid }
        ];
        if (getLocalData(localTasksKey, []).length === 0) {
          setLocalData(localTasksKey, defaultTasks);
          notifyLocalSubscribers('tasks', defaultTasks);
        }

        const localHabitsKey = `kairo_local_habits_${user.uid}`;
        const defaultWellness = [
          { id: 'local_h1', label: "Beber agua", type: "water", time: "08:00", completed: false, group: "wellness", userId: user.uid },
          { id: 'local_h2', label: "Almuerzo saludable", type: "food", time: "13:00", completed: false, group: "wellness", userId: user.uid },
          { id: 'local_h3', label: "Descanso visual", type: "rest", time: "16:00", completed: false, group: "wellness", userId: user.uid },
          { id: 'local_h4', activity: "Despertar y estirar", type: "rest", time: "07:00", completed: false, group: "routine", userId: user.uid },
          { id: 'local_h5', activity: "Revisar pendientes", type: "work", time: "09:00", completed: false, group: "routine", userId: user.uid },
          // Quick habits (defaults)
          { id: 'local_qh1', label: 'Agua', type: 'water', completed: false, group: 'quickHabit', userId: user.uid },
          { id: 'local_qh2', label: 'Comida', type: 'food', completed: false, group: 'quickHabit', userId: user.uid },
          { id: 'local_qh3', label: 'Relax', type: 'rest', completed: false, group: 'quickHabit', userId: user.uid },
          { id: 'local_qh4', label: 'Zen', type: 'medicine', completed: false, group: 'quickHabit', userId: user.uid },
        ];
        if (getLocalData(localHabitsKey, []).length === 0) {
          setLocalData(localHabitsKey, defaultWellness);
          notifyLocalSubscribers('habits', defaultWellness);
        }

        const localAlarmsKey = `kairo_local_alarms_${user.uid}`;
        const defaultAlarms = [
          { id: 'local_a1', title: "Desayuno", category: "meal", time: "08:00", days: ["Todos"], enabled: true, userId: user.uid },
          { id: 'local_a2', title: "Vitaminas", category: "medicine", time: "09:30", days: ["Todos"], enabled: true, userId: user.uid }
        ];
        if (getLocalData(localAlarmsKey, []).length === 0) {
          setLocalData(localAlarmsKey, defaultAlarms);
          notifyLocalSubscribers('alarms', defaultAlarms);
        }

        const finalizedLocal = { ...updatedProfile, habitsInitialized: true };
        setLocalData(localKey, finalizedLocal);
        notifyLocalSubscribers('profile', finalizedLocal);
      }
      return;
    }

    const path = `users/${user.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const existingData = snap.exists() ? snap.data() : {};
      
      let kairosId = existingData.kairosId || null;
      if (!kairosId) {
        kairosId = `@kairos_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const isNewUser = !snap.exists();

      const newData = {
        uid: user.uid,
        kairosId,
        name: existingData.name || user.displayName || profile.name || 'Usuario',
        photoURL: existingData.photoURL || user.photoURL || profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        mascotName: existingData.mascotName || profile.mascotName || 'Kairo',
        streak: existingData.streak ?? profile.streak ?? 0,
        balance: existingData.balance ?? profile.balance ?? 0,
        lastActive: serverTimestamp(),
        habitsInitialized: existingData.habitsInitialized ?? profile.habitsInitialized ?? false,
      };

      await setDoc(doc(db, 'users', user.uid), newData, { merge: true });

      // If we recovered inside syncProfile, turn off local exceed
      if (isFirestoreQuotaExceededGlobal) {
        isFirestoreQuotaExceededGlobal = false;
        localStorage.removeItem('kairo_firestore_quota_exceeded');
        quotaListeners.forEach(cb => cb(false));
      }

      if (isNewUser && !isInitializingDefaults) {
        isInitializingDefaults = true;

        const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid));
        const habitsSnap = await getDocs(habitsQuery);
        
        if (habitsSnap.empty) {
          // Tareas predeterminadas
          const defaultTasks = [
            { title: "Terminar proyecto pendiente", category: "work", completed: false },
            { title: "Hacer ejercicio 30 min", category: "wellness", completed: false },
            { title: "Leer 20 minutos", category: "personal", completed: false }
          ];
          for (const t of defaultTasks) {
            await addDoc(collection(db, 'tasks'), { ...t, userId: user.uid, createdAt: serverTimestamp() });
          }

          // Hábitos de bienestar predeterminados
          const defaultWellness = [
            { label: "Beber agua", type: "water", time: "08:00", completed: false, group: "wellness" },
            { label: "Almuerzo saludable", type: "food", time: "13:00", completed: false, group: "wellness" },
            { label: "Descanso visual", type: "rest", time: "16:00", completed: false, group: "wellness" }
          ];
          for (const w of defaultWellness) {
            await addDoc(collection(db, 'habits'), { ...w, userId: user.uid, createdAt: serverTimestamp() });
          }

          // Rutinas predeterminadas
          const defaultRoutines = [
            { activity: "Despertar y estirar", type: "rest", time: "07:00", completed: false, group: "routine" },
            { activity: "Revisar pendientes", type: "work", time: "09:00", completed: false, group: "routine" }
          ];
          for (const r of defaultRoutines) {
            await addDoc(collection(db, 'habits'), { ...r, userId: user.uid, createdAt: serverTimestamp() });
          }

          // Alarmas predeterminadas
          const defaultAlarms = [
            { title: "Desayuno", category: "meal", time: "08:00", days: ["Todos"], enabled: true },
            { title: "Vitaminas", category: "medicine", time: "09:30", days: ["Todos"], enabled: true }
          ];
          for (const a of defaultAlarms) {
            await addDoc(collection(db, 'alarms'), { ...a, userId: user.uid, createdAt: serverTimestamp() });
          }
        }

        await setDoc(doc(db, 'users', user.uid), { habitsInitialized: true }, { merge: true });
        
        const finalLocal = { ...newData, habitsInitialized: true };
        setLocalData(localKey, finalLocal);
        notifyLocalSubscribers('profile', finalLocal);
      }
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
        console.warn("Firestore quota exceeded inside syncProfile, using local.");
      } else {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    }
  },

  subscribeToProfile(callback: (profile: UserProfile | null) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const localKey = `kairo_local_profile_${user.uid}`;
    
    if (!localSubscribers['profile']) {
      localSubscribers['profile'] = new Set();
    }
    localSubscribers['profile'].add(callback);
    
    const localProfile = getLocalData(localKey, null);
    if (localProfile) {
      callback(localProfile);
    }

    if (isQuotaExceededSync()) {
      return () => {
        localSubscribers['profile'].delete(callback);
      };
    }

    const path = `users/${user.uid}`;
    const unsub = safeOnSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data() as UserProfile;
        setLocalData(localKey, remoteData);
        callback(remoteData);
      }
    }, (e) => {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
        if (localProfile) callback(localProfile);
      } else {
        handleFirestoreError(e, OperationType.LIST, path);
      }
    });

    return () => {
      unsub();
      localSubscribers['profile'].delete(callback);
    };
  },

  async getUser(uid: string): Promise<UserProfile | null> {
    const localKey = `kairo_local_user_${uid}`;
    const localUser = getLocalData(localKey, null);

    if (isQuotaExceededSync()) {
      return localUser;
    }

    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const u = snap.data() as UserProfile;
        setLocalData(localKey, u);
        return u;
      }
      return null;
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
        return localUser;
      }
      handleFirestoreError(e, OperationType.GET, path);
      return null;
    }
  },

  async getUserByKairosId(kairosId: string): Promise<UserProfile | null> {
    const cachedUsersKeys = Object.keys(localStorage).filter(k => k.startsWith('kairo_local_user_') || k.startsWith('kairo_local_profile_'));
    for (const key of cachedUsersKeys) {
      const cached = getLocalData(key, null);
      if (cached && cached.kairosId?.toLowerCase() === kairosId.toLowerCase()) {
        return cached;
      }
    }

    if (isQuotaExceededSync()) {
      return null;
    }

    const q = query(collection(db, 'users'), where('kairosId', '==', kairosId), limit(1));
    try {
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const u = snap.docs[0].data() as UserProfile;
      setLocalData(`kairo_local_user_${u.uid}`, u);
      return u;
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.LIST, 'users');
      }
      return null;
    }
  },

  // --- Friendships ---
  async addFriend(friendUid: string) {
    const user = auth.currentUser;
    if (!user || user.uid === friendUid) return;

    const localKey = `kairo_local_friends_${user.uid}`;
    let friends = getLocalData(localKey, []);

    const friendProfile = await this.getUser(friendUid);
    if (friendProfile && !friends.some((f: any) => f.uid === friendUid)) {
      friends.push(friendProfile);
      setLocalData(localKey, friends);
      notifyLocalSubscribers('friends', friends);
    }

    if (isQuotaExceededSync()) {
      return;
    }

    const path = 'friendships';
    try {
      const q = query(collection(db, 'friendships'), where('userIds', 'array-contains', user.uid));
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => d.data().userIds.includes(friendUid));
      if (existing) return;

      await addDoc(collection(db, 'friendships'), {
        userIds: [user.uid, friendUid].sort(),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.CREATE, path);
      }
    }
  },

  subscribeToFriends(callback: (friends: UserProfile[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const localKey = `kairo_local_friends_${user.uid}`;
    
    if (!localSubscribers['friends']) {
      localSubscribers['friends'] = new Set();
    }
    localSubscribers['friends'].add(callback);

    const localFriends = getLocalData(localKey, []);
    callback(localFriends);

    if (isQuotaExceededSync()) {
      return () => {
        localSubscribers['friends'].delete(callback);
      };
    }

    const q = query(collection(db, 'friendships'), where('userIds', 'array-contains', user.uid));
    const unsub = safeOnSnapshot(q, async (snap) => {
      const friendUids = snap.docs.map(d => d.data().userIds.find((id: string) => id !== user.uid));
      const profiles: UserProfile[] = [];
      for (const uid of friendUids) {
        const p = await this.getUser(uid);
        if (p) profiles.push(p);
      }
      setLocalData(localKey, profiles);
      notifyLocalSubscribers('friends', profiles);
    }, (e) => {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
        callback(getLocalData(localKey, []));
      } else {
        handleFirestoreError(e, OperationType.LIST, 'friendships');
      }
    });

    return () => {
      unsub();
      localSubscribers['friends'].delete(callback);
    };
  },

  // --- Interactions ---
  async sendInteraction(toUserId: string, type: Interaction['type']) {
    const user = auth.currentUser;
    if (!user) return;

    // Save locally
    const localKey = `kairo_local_interactions_${user.uid}`;
    const interactions = getLocalData(localKey, []);
    const newInteraction: Interaction = {
      id: `local_int_${Date.now()}`,
      fromUserId: user.uid,
      toUserId,
      type,
      timestamp: new Date().toISOString(),
    };
    interactions.push(newInteraction);
    setLocalData(localKey, interactions);
    notifyLocalSubscribers('interactions', interactions);

    if (isQuotaExceededSync()) {
      return;
    }

    const path = 'interactions';
    try {
      await addDoc(collection(db, 'interactions'), {
        fromUserId: user.uid,
        toUserId,
        type,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.CREATE, path);
      }
    }
  },

  subscribeToInteractions(callback: (interactions: Interaction[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const localKey = `kairo_local_interactions_${user.uid}`;
    if (!localSubscribers['interactions']) {
      localSubscribers['interactions'] = new Set();
    }
    localSubscribers['interactions'].add(callback);

    const localInteractions = getLocalData(localKey, []);
    callback(localInteractions);

    if (isQuotaExceededSync()) {
      return () => {
        localSubscribers['interactions'].delete(callback);
      };
    }

    const q = query(
      collection(db, 'interactions'),
      where('toUserId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsub = safeOnSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Interaction));
      setLocalData(localKey, items);
      notifyLocalSubscribers('interactions', items);
    }, (e) => {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
        callback(getLocalData(localKey, []));
      } else {
        handleFirestoreError(e, OperationType.LIST, 'interactions');
      }
    });

    return () => {
      unsub();
      localSubscribers['interactions'].delete(callback);
    };
  },

  // --- Data Sync ---
  async saveTask(task: any) {
    const user = auth.currentUser;
    if (!user) return;

    const localKey = `kairo_local_tasks_${user.uid}`;
    const localTasks = getLocalData(localKey, []);
    
    const tempId = task.id || `local_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedTask = {
      ...task,
      id: tempId,
      userId: user.uid,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const idx = localTasks.findIndex((t: any) => t.id === task.id);
    if (idx > -1) {
      localTasks[idx] = updatedTask;
    } else {
      localTasks.push(updatedTask);
    }
    setLocalData(localKey, localTasks);
    notifyLocalSubscribers('tasks', localTasks);

    if (isQuotaExceededSync()) return;

    try {
      if (task.id && !task.id.startsWith('temp_') && !task.id.startsWith('local_')) {
        await setDoc(doc(db, 'tasks', task.id), { ...task, userId: user.uid, updatedAt: serverTimestamp() });
      } else {
        const { id, ...rest } = task;
        await addDoc(collection(db, 'tasks'), { ...rest, userId: user.uid, createdAt: serverTimestamp() });
      }
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.WRITE, 'tasks');
      }
    }
  },

  async deleteTask(taskId: string) {
    const user = auth.currentUser;
    if (user) {
      const localKey = `kairo_local_tasks_${user.uid}`;
      const localTasks = getLocalData(localKey, []).filter((t: any) => t.id !== taskId);
      setLocalData(localKey, localTasks);
      notifyLocalSubscribers('tasks', localTasks);
    }

    if (isQuotaExceededSync() || taskId.startsWith('local_')) return;

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.DELETE, 'tasks');
      }
    }
  },

  subscribeToTasks(callback: (tasks: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const localKey = `kairo_local_tasks_${user.uid}`;
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    return subscribeCollection('tasks', q, localKey, callback);
  },

  async saveHabit(habit: any) {
    const user = auth.currentUser;
    if (!user) return;

    const localKey = `kairo_local_habits_${user.uid}`;
    const localHabits = getLocalData(localKey, []);

    const tempId = habit.id || `local_habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedHabit = {
      ...habit,
      id: tempId,
      userId: user.uid,
      createdAt: habit.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const idx = localHabits.findIndex((h: any) => h.id === habit.id);
    if (idx > -1) {
      localHabits[idx] = updatedHabit;
    } else {
      localHabits.push(updatedHabit);
    }
    setLocalData(localKey, localHabits);
    notifyLocalSubscribers('habits', localHabits);

    if (isQuotaExceededSync()) return;

    try {
      if (habit.id && !habit.id.startsWith('temp_') && !habit.id.startsWith('local_')) {
        await setDoc(doc(db, 'habits', habit.id), { ...habit, userId: user.uid, updatedAt: serverTimestamp() });
      } else {
        const { id, ...rest } = habit;
        await addDoc(collection(db, 'habits'), { ...rest, userId: user.uid, createdAt: serverTimestamp() });
      }
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.WRITE, 'habits');
      }
    }
  },

  async deleteHabit(habitId: string) {
    const user = auth.currentUser;
    if (user) {
      const localKey = `kairo_local_habits_${user.uid}`;
      const localHabits = getLocalData(localKey, []).filter((h: any) => h.id !== habitId);
      setLocalData(localKey, localHabits);
      notifyLocalSubscribers('habits', localHabits);
    }

    if (isQuotaExceededSync() || habitId.startsWith('local_')) return;

    try {
      await deleteDoc(doc(db, 'habits', habitId));
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.DELETE, 'habits');
      }
    }
  },

  subscribeToHabits(callback: (habits: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const localKey = `kairo_local_habits_${user.uid}`;
    const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
    return subscribeCollection('habits', q, localKey, callback);
  },

  async saveAlarm(alarm: any) {
    const user = auth.currentUser;
    if (!user) return;

    const localKey = `kairo_local_alarms_${user.uid}`;
    const localAlarms = getLocalData(localKey, []);

    const tempId = alarm.id || `local_alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedAlarm = {
      ...alarm,
      id: tempId,
      userId: user.uid,
      createdAt: alarm.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const idx = localAlarms.findIndex((a: any) => a.id === alarm.id);
    if (idx > -1) {
      localAlarms[idx] = updatedAlarm;
    } else {
      localAlarms.push(updatedAlarm);
    }
    setLocalData(localKey, localAlarms);
    notifyLocalSubscribers('alarms', localAlarms);

    if (isQuotaExceededSync()) return;

    try {
      if (alarm.id && !alarm.id.startsWith('temp_') && !alarm.id.startsWith('local_')) {
        await setDoc(doc(db, 'alarms', alarm.id), { ...alarm, userId: user.uid, updatedAt: serverTimestamp() });
      } else {
        const { id, ...rest } = alarm;
        await addDoc(collection(db, 'alarms'), { ...rest, userId: user.uid, createdAt: serverTimestamp() });
      }
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.WRITE, 'alarms');
      }
    }
  },

  async deleteAlarm(alarmId: string) {
    const user = auth.currentUser;
    if (user) {
      const localKey = `kairo_local_alarms_${user.uid}`;
      const localAlarms = getLocalData(localKey, []).filter((a: any) => a.id !== alarmId);
      setLocalData(localKey, localAlarms);
      notifyLocalSubscribers('alarms', localAlarms);
    }

    if (isQuotaExceededSync() || alarmId.startsWith('local_')) return;

    try {
      await deleteDoc(doc(db, 'alarms', alarmId));
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.DELETE, 'alarms');
      }
    }
  },

  subscribeToAlarms(callback: (alarms: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const localKey = `kairo_local_alarms_${user.uid}`;
    const q = query(collection(db, 'alarms'), where('userId', '==', user.uid));
    return subscribeCollection('alarms', q, localKey, callback);
  },

  async saveEvent(event: any) {
    const user = auth.currentUser;
    if (!user) return;

    const localKey = `kairo_local_events_${user.uid}`;
    const localEvents = getLocalData(localKey, []);

    const tempId = event.id || `local_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedEvent = {
      ...event,
      id: tempId,
      userId: user.uid,
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const idx = localEvents.findIndex((e: any) => e.id === event.id);
    if (idx > -1) {
      localEvents[idx] = updatedEvent;
    } else {
      localEvents.push(updatedEvent);
    }
    setLocalData(localKey, localEvents);
    notifyLocalSubscribers('events', localEvents);

    if (isQuotaExceededSync()) return;

    try {
      if (event.id && !event.id.startsWith('temp_') && !event.id.startsWith('local_')) {
        await setDoc(doc(db, 'events', event.id), { ...event, userId: user.uid, updatedAt: serverTimestamp() });
      } else {
        const { id, ...rest } = event;
        await addDoc(collection(db, 'events'), { ...rest, userId: user.uid, createdAt: serverTimestamp() });
      }
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.WRITE, 'events');
      }
    }
  },

  async deleteEvent(eventId: string) {
    const user = auth.currentUser;
    if (user) {
      const localKey = `kairo_local_events_${user.uid}`;
      const localEvents = getLocalData(localKey, []).filter((e: any) => e.id !== eventId);
      setLocalData(localKey, localEvents);
      notifyLocalSubscribers('events', localEvents);
    }

    if (isQuotaExceededSync() || eventId.startsWith('local_')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.DELETE, 'events');
      }
    }
  },

  subscribeToEvents(callback: (events: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const localKey = `kairo_local_events_${user.uid}`;
    const q = query(collection(db, 'events'), where('userId', '==', user.uid));
    return subscribeCollection('events', q, localKey, callback);
  },

  async unlockAchievement(achievement: any) {
    const user = auth.currentUser;
    if (!user) return;

    const localKey = `kairo_local_achievements_${user.uid}`;
    const localAchievements = getLocalData(localKey, []);

    if (localAchievements.some((a: any) => a.title === achievement.title)) return;

    const newAchievement = {
      ...achievement,
      id: `local_ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.uid,
      unlockedAt: new Date().toISOString()
    };

    localAchievements.push(newAchievement);
    setLocalData(localKey, localAchievements);
    notifyLocalSubscribers('achievements', localAchievements);

    if (isQuotaExceededSync()) return;

    try {
      const q = query(collection(db, 'achievements'), where('userId', '==', user.uid), where('title', '==', achievement.title));
      const snap = await getDocs(q);
      if (!snap.empty) return;

      await addDoc(collection(db, 'achievements'), { ...achievement, userId: user.uid, unlockedAt: serverTimestamp() });
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.WRITE, 'achievements');
      }
    }
  },

  subscribeToAchievements(callback: (achievements: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const localKey = `kairo_local_achievements_${user.uid}`;
    const q = query(collection(db, 'achievements'), where('userId', '==', user.uid));
    return subscribeCollection('achievements', q, localKey, callback);
  },

  async saveProgressHistory(date: string, value: number) {
    const user = auth.currentUser;
    if (!user) return;
    const docId = `${user.uid}_${date}`;

    const localKey = `kairo_local_progressHistory_${user.uid}`;
    const localHistory = getLocalData(localKey, []);

    const updatedItem = {
      userId: user.uid,
      date,
      value
    };

    const idx = localHistory.findIndex((h: any) => h.date === date);
    if (idx > -1) {
      localHistory[idx] = updatedItem;
    } else {
      localHistory.push(updatedItem);
    }
    
    localHistory.sort((a: any, b: any) => a.date.localeCompare(b.date));
    setLocalData(localKey, localHistory);
    notifyLocalSubscribers('progressHistory', localHistory);

    if (isQuotaExceededSync()) return;

    try {
      await setDoc(doc(db, 'progressHistory', docId), updatedItem);
    } catch (e) {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(e, OperationType.WRITE, `progressHistory/${docId}`);
      }
    }
  },

  subscribeToProgressHistory(callback: (history: any[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};
    const localKey = `kairo_local_progressHistory_${user.uid}`;
    
    if (!localSubscribers['progressHistory']) {
      localSubscribers['progressHistory'] = new Set();
    }
    localSubscribers['progressHistory'].add(callback);

    const localItems = getLocalData(localKey, []);
    localItems.sort((a: any, b: any) => a.date.localeCompare(b.date));
    callback(localItems);

    if (isQuotaExceededSync()) {
      return () => {
        localSubscribers['progressHistory'].delete(callback);
      };
    }

    const q = query(
      collection(db, 'progressHistory'), 
      where('userId', '==', user.uid),
      orderBy('date', 'asc')
    );
    const unsub = safeOnSnapshot(q, (snap) => {
      const list = snap.docs.map(d => d.data());
      setLocalData(localKey, list);
      notifyLocalSubscribers('progressHistory', list);
    }, (e) => {
      if (isQuotaError(e)) {
        triggerQuotaExceeded();
        callback(getLocalData(localKey, []));
      } else {
        handleFirestoreError(e, OperationType.LIST, 'progressHistory');
      }
    });

    return () => {
      unsub();
      localSubscribers['progressHistory'].delete(callback);
    };
  },

  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) return;

    if (!isQuotaExceededSync()) {
      const collectionsToDelete = ['tasks', 'habits', 'alarms', 'events', 'achievements', 'progressHistory'];
      
      for (const colName of collectionsToDelete) {
        const q = query(collection(db, colName), where('userId', '==', user.uid));
        try {
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            await deleteDoc(doc(db, colName, docSnap.id));
          }
        } catch (e) {
          console.error(`Error deleting from ${colName}:`, e);
        }
      }
    }

    // Delete local storage keys
    const localKeysPrefixes = [
      `kairo_local_profile_${user.uid}`,
      `kairo_local_tasks_${user.uid}`,
      `kairo_local_habits_${user.uid}`,
      `kairo_local_alarms_${user.uid}`,
      `kairo_local_events_${user.uid}`,
      `kairo_local_achievements_${user.uid}`,
      `kairo_local_progressHistory_${user.uid}`,
      `kairo_local_friends_${user.uid}`,
      `kairo_local_interactions_${user.uid}`,
    ];
    for (const key of localKeysPrefixes) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem('kairo_firestore_quota_exceeded');

    // Delete user profile doc
    if (!isQuotaExceededSync()) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (e) {
        console.error('Error deleting user profile:', e);
      }
    }

    // Delete auth user
    await user.delete();
  }
};