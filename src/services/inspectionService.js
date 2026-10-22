import { isFirebaseConfigured, db } from './firebase.js';
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';

export const inspectionService = {
  async getInspections() {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load inspections.');
    }
    const q = query(collection(db, 'inspections'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async recordInspection(data) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot record inspection.');
    }
    const docRef = await addDoc(collection(db, 'inspections'), {
      ...data,
      date: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }
};
