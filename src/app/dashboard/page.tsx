import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../supabase/server";
import { InfoIcon, UserCircle, Video } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SubscriptionCheck } from "@/components/subscription-check";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="bg-secondary/50 text-sm p-3 px-4 rounded-lg text-muted-foreground flex gap-2 items-center">
              <InfoIcon size="14" />
              <span>This is a protected page only visible to authenticated users</span>
            </div>
          </header>

          {/* User Profile Section */}
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

          {/* Create Video Section */}
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
  );
}
