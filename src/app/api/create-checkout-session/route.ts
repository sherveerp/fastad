// src/app/api/create-checkout-session/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers, cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const CREDIT_PACKS = {
  'starter': { amount: 500, credits: 5 },     // $5
  'standard': { amount: 1500, credits: 20 },  // $15
  'pro': { amount: 6000, credits: 100 },      // $60
};

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ headers, cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { packId } = await req.json();
  const pack = CREDIT_PACKS[packId];
  if (!pack) return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${pack.credits} Video Credits`,
        },
        unit_amount: pack.amount,
      },
      quantity: 1,
    }],
    metadata: {
      user_id: user.id,
      credits: pack.credits.toString(),
    },
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?cancelled=true`,
  });

  return NextResponse.json({ url: session.url });
}
