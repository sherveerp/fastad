'use client';

import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';


import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export function SignInWithGoogleButton() {
  const handleGoogleSignIn = async () => {
    const supabase = createPagesBrowserClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`, // or wherever
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full bg-white border border-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-100"
    >
      Sign in with Google
    </button>
  );
}
