'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Button } from './ui/button';
import UserProfile from './user-profile';

export default function Navbar() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          FastAd
        </Link>
        <div className="flex gap-4 items-center">
          {!loading && user ? (
            <>
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Sign In
              </Link>
              <Link href="/sign-up" className="text-sm font-medium text-white bg-black rounded-md px-4 py-2 hover:bg-gray-800">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
