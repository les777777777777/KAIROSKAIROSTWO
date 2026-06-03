import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, terminate } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

async function testConnection() {
  // Auto-reset Firestore quota exceeded on a new day
  const quotaDate = localStorage.getItem('kairo_firestore_quota_date');
  const todayDate = new Date().toDateString();
  if (quotaDate && quotaDate !== todayDate) {
    localStorage.removeItem('kairo_firestore_quota_exceeded');
    localStorage.removeItem('kairo_firestore_quota_date');
  }

  if (localStorage.getItem('kairo_firestore_quota_exceeded') === 'true') {
    try {
      terminate(db).catch(() => {});
    } catch (_) {}
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const msg = String(error?.message || error || '').toLowerCase();
    if (
      msg.includes('quota') ||
      msg.includes('resource-exhausted') ||
      msg.includes('resource_exhausted') ||
      msg.includes('limit exceeded') ||
      msg.includes('exhausted')
    ) {
      localStorage.setItem('kairo_firestore_quota_exceeded', 'true');
      localStorage.setItem('kairo_firestore_quota_date', new Date().toDateString());
      try {
        terminate(db).catch(() => {});
      } catch (_) {}
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// Only run in browser
if (typeof window !== 'undefined') {
  testConnection();
}