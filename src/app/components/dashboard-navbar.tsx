// src/app/components/dashboard-navbar.tsx
'use client';

import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import { InfoIcon, UserCircle, Video } from 'lucide-react';
import type { Database } from '@/types/supabase';

export default function DashboardNavbar() {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();

  const handleSignOut = async () => {
    await fetch('/api/signout', {
      method: 'POST',
    });
    window.location.href = '/sign-in';
  };

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold">
          <InfoIcon size={24} /> FastAd
        </Link>
        <div className="flex items-center gap-6">
          {user && (
            <div className="flex items-center gap-2">
              <UserCircle size={24} />
              <span className="text-sm">{user.email}</span>
            </div>
          )}
          <Link href="/studio" className="text-sm hover:underline">
            <Video size={20} className="inline-block mr-1" />
            Studio
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
