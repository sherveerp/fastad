// src/app/studio/page.tsx

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

import SubscriptionCheck from '@/app/components/subscription-check'
import DashboardNavbar   from '@/app/components/dashboard-navbar'
import StudioClient      from '@/app/components/studio-client'

export default async function StudioPage() {
  // use the server‐component factory
  const supabase = createServerComponentClient<Database>({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // kick out if not signed in
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">Video Studio</h1>
        <StudioClient />
      </main>
    </SubscriptionCheck>
  )
}
