import { isFirebaseConfigured, db } from './firebase.js';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export const calendarService = {
  async getCalendarEvents() {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load calendar events.');
    }
    const snap = await getDocs(collection(db, 'calendarEvents'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async createCalendarEvent(data) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot create calendar event.');
    }
    const docRef = await addDoc(collection(db, 'calendarEvents'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }
};
