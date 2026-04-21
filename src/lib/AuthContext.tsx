import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, doc, getDoc, setDoc, serverTimestamp, db, OperationType, handleFirestoreError, onSnapshot } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user document
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              createdAt: serverTimestamp(),
              stats: {
                totalWorkouts: 0,
                streak: 0,
                lastWorkoutDate: null
              }
            });
          }

          // Listen to profile changes
          unsubProfile = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            }
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
        if (unsubProfile) unsubProfile();
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { signInWithPopup, googleProvider } = await import('./firebase');
    
    // Force account selection to avoid stuck sessions in iframe
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
       console.error("Sign in error", error);
       
       if (error.code === 'auth/popup-closed-by-user') {
         alert("The sign-in popup was closed before completion. Please try again and ensure you complete the sign-in process in the window that opens.\n\nTip: If you don't see a window, check if your browser blocked the popup.");
       } else if (error.code === 'auth/cancelled-popup-request') {
         // This happens if multiple sign-in requests are made rapidly
         return;
       } else {
         alert(`Sign in failed: ${error.message}`);
       }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const signOut = async (auth: any) => {
  const { signOut } = await import('./firebase');
  return signOut(auth);
};
