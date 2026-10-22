import { isFirebaseConfigured, db } from './firebase.js';
import { collection, getDocs, updateDoc, doc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

export const notificationService = {
  async getNotifications(userId) {
    if (!userId) return [];
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load notifications.');
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const getMs = (v) => {
        if (!v) return 0;
        if (typeof v.toMillis === 'function') return v.toMillis();
        if (typeof v.seconds === 'number') return v.seconds * 1000;
        const parsed = new Date(v).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return getMs(b.createdAt) - getMs(a.createdAt);
    });
    return list;
  },

  async markAsRead(notificationId) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot update notification.');
    }
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
    return { success: true, id: notificationId };
  },

  async markAllAsRead(userId) {
    if (!userId) return;
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot update notifications.');
    }
    const list = await this.getNotifications(userId);
    await Promise.all(
      list.filter((n) => !n.read).map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }))
    );
    return { success: true, count: list.filter((n) => !n.read).length };
  },

  async createNotification(data) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot create notification.');
    }
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...data, read: false };
  }
};
