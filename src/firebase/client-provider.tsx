'use client';

import React, { useMemo, type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider, FirebaseContext, type FirebaseContextState } from './provider';
import { initializeFirebase } from './app';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

const emptyContext: FirebaseContextState = {
  areServicesAvailable: false,
  firebaseApp: null,
  firestore: null,
  auth: null,
  user: null,
  isUserLoading: true,
  userError: null,
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const firebaseServices = useMemo(() => {
    // initializeFirebase already checks for window, but useMemo double-checks intent
    return initializeFirebase();
  }, []);

  // During SSR or initial hydration, we provide an empty context to avoid 
  // "context undefined" errors in child components while preventing 
  // the client-only SDK chunks from loading prematurely or incorrectly.
  if (!isMounted || !firebaseServices) {
    return (
      <FirebaseContext.Provider value={emptyContext}>
        {children}
      </FirebaseContext.Provider>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
