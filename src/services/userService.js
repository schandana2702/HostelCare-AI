import { isFirebaseConfigured, db, functions } from './firebase.js';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export const userService = {
  /**
   * Fetch all registered users from Cloud Firestore.
   */
  async getUsers() {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load user registry.');
    }
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  },

  /**
   * Fetch maintenance staff members from Firestore.
   */
  async getMaintenanceStaff() {
    const all = await this.getUsers();
    return all.filter((u) => u.role === 'maintenance' && u.status !== 'suspended');
  },

  /**
   * Create a privileged user account (Warden, Maintenance Staff, Administrator).
   *
   * Calls the secure Firebase Cloud Function 'createPrivilegedUser'.
   * The backend function verifies that the caller is an authenticated Administrator,
   * creates the real Firebase Authentication user via Admin SDK, and writes the
   * Firestore /users/{uid} document with the assigned role, status, and metadata.
   */
  async createPrivilegedUser({ email, password, displayName, role, hostelBlock = '', roomNumber = '', phone = '' }) {
    if (!isFirebaseConfigured || !functions) {
      throw new Error('Firebase is not configured. Cannot create user.');
    }

    try {
      const createFn = httpsCallable(functions, 'createPrivilegedUser');
      const result = await createFn({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
        hostelBlock: hostelBlock.trim(),
        roomNumber: roomNumber.trim(),
        phone: phone.trim()
      });
      return result.data;
    } catch (err) {
      console.error('Failed to create privileged user:', err);
      if (err.code === 'functions/not-found' || err.code === 'not-found') {
        throw new Error(
          "Cloud Function 'createPrivilegedUser' is not yet deployed to Firebase. " +
          "Run 'firebase deploy --only functions' in the project directory, or create the account directly in Firebase Console."
        );
      }
      if (err.code === 'functions/permission-denied' || err.code === 'permission-denied') {
        throw new Error('Permission denied: Only active Administrators can create privileged staff accounts.');
      }
      if (err.code === 'functions/already-exists' || err.code === 'already-exists') {
        throw new Error('An account with this email address already exists in Firebase Authentication.');
      }
      throw new Error(err.message || 'Failed to create privileged user account.');
    }
  },

  /**
   * Update a user's role in Firestore (Admin only).
   */
  async updateUserRole(uid, newRole) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { role: newRole });
  },

  /**
   * Toggle a user's account status (active / suspended) in Firestore (Admin only).
   */
  async toggleUserStatus(uid, newStatus) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { status: newStatus });
  },

  /**
   * Save or merge user profile fields in Firestore.
   */
  async saveUserProfile(uid, data) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, data, { merge: true });
  }
};
