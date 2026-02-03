'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';

export default function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Notify Farcaster that the frame is ready to be displayed
        await sdk.actions.ready();
      } catch (e) {
        // This might fail if not running inside a Farcaster client, which is fine
        console.warn('Failed to initialize Farcaster SDK (running outside Farcaster?):', e);
      }
      setIsSDKLoaded(true);
    };
    
    // Only run once
    if (!isSDKLoaded) {
      load();
    }
  }, [isSDKLoaded]);

  return <>{children}</>;
}
