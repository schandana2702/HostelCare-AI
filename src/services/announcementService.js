import { isFirebaseConfigured, db } from './firebase.js';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';

export const announcementService = {
  async getAnnouncements() {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load announcements.');
    }
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async createAnnouncement(data) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot create announcement.');
    }
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },

  async deleteAnnouncement(id) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot delete announcement.');
    }
    await deleteDoc(doc(db, 'announcements', id));
    return { success: true, id };
  }
};
