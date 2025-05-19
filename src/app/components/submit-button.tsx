'use client';

import { Button } from "@/app/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
