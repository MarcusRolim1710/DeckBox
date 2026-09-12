import * as React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { useEffect } from 'react';
import { getDb } from './src/db/client';

export default function App() {
  useEffect(() => {
    getDb().catch(console.error);
  }, []);
  return <AppNavigator />;
}
