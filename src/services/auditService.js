import { isFirebaseConfigured, db } from './firebase.js';
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';

export const auditService = {
  async getAuditLogs() {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load audit logs.');
    }
    let snap;
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
      snap = await getDocs(q);
    } catch (queryErr) {
      if (queryErr?.code === 'permission-denied') {
        throw queryErr;
      }
      snap = await getDocs(collection(db, 'auditLogs'));
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const getMs = (v) => {
        if (!v) return 0;
        if (typeof v.toMillis === 'function') return v.toMillis();
        if (typeof v.seconds === 'number') return v.seconds * 1000;
        const parsed = new Date(v).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return getMs(b.timestamp) - getMs(a.timestamp);
    });
    return list;
  },

  async logAction(action, actor, targetId, details) {
    const logData = {
      action,
      actorName: actor?.displayName || actor?.name || 'System',
      actorRole: actor?.role || 'system',
      targetId,
      details
    };

    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot record audit log.');
    }
    const docRef = await addDoc(collection(db, 'auditLogs'), {
      ...logData,
      timestamp: serverTimestamp()
    });
    return { id: docRef.id, ...logData };
  }
};
