// src/app/api/webhook/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'home'; // Optional

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('❌ Stripe webhook signature verification failed.', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (!userId || !credits) {
      console.error('❌ Missing metadata on Stripe session');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    console.log('📦 Calling add_credits with:', {
    p_user_id: userId,
    credits_to_add: credits,
    });

    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/add_credits`, {
    method: 'POST',
    headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        p_user_id: userId,
        credits_to_add: credits,
    }),
    });

    if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ REST RPC call failed:', errorText);
    return NextResponse.json({ error: 'REST RPC failed' }, { status: 500 });
    }

    console.log(`✅ REST RPC credited ${credits} to user ${userId}`);


    console.log(`✅ Credited ${credits} to user ${userId}`);
  }

  return NextResponse.json({ received: true });
}
