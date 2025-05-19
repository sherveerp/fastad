// src/app/dashboard/page.tsx

import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { redirect } from 'next/navigation'
import DashboardNavbar from '@/app/components/dashboard-navbar'
import SubscriptionCheck from '@/app/components/subscription-check'
import { InfoIcon, UserCircle, Video } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  // Pass the cookies helper directly, not wrapped in a lambda
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size={14} />
              <span>This is a protected page only visible to authenticated users</span>
            </div>
          </header>

          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">User Profile</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 overflow-hidden">
              <pre className="text-xs font-mono max-h-48 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </section>

          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-xl flex items-center gap-2">
                <Video size={20} />
                Create a Video
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Launch the video studio to start creating new videos.
            </p>
            <Link href="/studio">
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                Go to Video Studio
              </button>
            </Link>
          </section>
        </div>
      </main>
    </SubscriptionCheck>
  )
}
