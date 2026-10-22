import { isFirebaseConfigured, db } from './firebase.js';
import { collection, getDocs, addDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';

export const auditService = {
  async getAuditLogs() {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load audit logs.');
    }
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
