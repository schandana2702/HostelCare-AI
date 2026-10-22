import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseConfigured, auth, db } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, show the setup page — no fallback
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser({ uid: firebaseUser.uid, ...userDoc.data() });
          } else {
            // Auth account exists but no Firestore profile yet
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'User',
              role: 'student'
            });
          }
        } catch {
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'User',
            role: 'student'
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Login — Firebase Authentication only.
   * No mock accounts, no demo mode.
   */
  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Contact the system administrator.'
      );
    }
    const res = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', res.user.uid));
    const profile = userDoc.exists() ? userDoc.data() : { role: 'student' };
    const user = { uid: res.user.uid, ...profile };
    setCurrentUser(user);
    return user;
  };

  /**
   * Register — Students only.
   *
   * Privileged roles (warden, maintenance, admin) are NOT assignable through
   * public registration. An existing administrator must assign those roles
   * via the Admin → User Management panel after the user has registered as
   * a student, OR the system owner creates the first admin account directly
   * in the Firebase Authentication Console and sets role: 'admin' in Firestore.
   *
   * The Firestore security rule for /users/{uid} enforces role == 'student'
   * on document creation, so no client-side bypass is possible.
   */
  const register = async (email, password, profileData) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Contact the system administrator.'
      );
    }

    // Hard-enforce student-only registration at the application layer.
    // Any attempt to pass a privileged role is silently overridden to 'student'.
    // The Firestore security rule provides the second enforcement layer.
    const role = 'student';

    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: profileData.displayName });

    const newUserData = {
      uid: res.user.uid,
      email,
      displayName: profileData.displayName,
      role,                                      // always 'student'
      hostelBlock:  profileData.hostelBlock  || '',
      roomNumber:   profileData.roomNumber   || '',
      phone:        profileData.phone        || '',
      rollNumber:   profileData.rollNumber   || '',
      status:       'active',
      createdAt:    serverTimestamp()
    };

    // Atomically write the Firestore profile. If this fails (e.g. because
    // Firestore rules have not been deployed yet), delete the just-created
    // Auth account so the user can retry instead of being stuck with an
    // orphaned Auth record that blocks future registration attempts.
    try {
      await setDoc(doc(db, 'users', res.user.uid), newUserData);
    } catch (firestoreErr) {
      // Clean up the orphaned Auth account so the email remains reusable.
      try { await deleteUser(res.user); } catch { /* best-effort cleanup */ }

      if (firestoreErr.code === 'permission-denied') {
        throw new Error(
          'Registration is temporarily unavailable: the database security ' +
          'rules have not been deployed yet. Please ask the system ' +
          'administrator to run: firebase deploy --only firestore:rules'
        );
      }
      throw firestoreErr;
    }

    setCurrentUser({ ...newUserData, uid: res.user.uid });
    return newUserData;
  };

  /**
   * Logout
   */
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
