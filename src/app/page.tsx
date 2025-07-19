import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

const supabase = createServerComponentClient<Database>({
  cookies,
});

import Hero from "@/app/components/hero";
import Navbar from "@/app/components/navbar";
import PricingCard from "@/app/components/pricing-card";
import Footer from "@/app/components/footer";
import { createClient } from "@/supabase/server";
import {
  ArrowUpRight,
  CheckCircle2,
  Wand2,
  Video,
  Share2,
  Palette,
  Layout,
  Sparkles,
  Laptop,
} from "lucide-react";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create professional video ads in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Palette className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                1. Choose a Template
              </h3>
              <p className="text-gray-600">
                Browse our library of industry-specific templates or let our AI
                suggest the perfect one based on your business.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Layout className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                2. Customize Your Ad
              </h3>
              <p className="text-gray-600">
                Drag and drop your logo, products, and text. Adjust colors and
                fonts to match your brand identity.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Export & Share</h3>
              <p className="text-gray-600">
                Export your video in the perfect format for TikTok, Instagram
                Reels, or YouTube Shorts with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to create professional video ads without
              design expertise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Wand2 className="w-6 h-6" />,
                title: "AI-Powered Suggestions",
                description:
                  "Generate ad concepts based on your business description",
              },
              {
                icon: <Video className="w-6 h-6" />,
                title: "Template Library",
                description:
                  "Industry-specific templates for any business need",
              },
              {
                icon: <Layout className="w-6 h-6" />,
                title: "Drag & Drop Editor",
                description: "Easily add logos, products, and text elements",
              },
              {
                icon: <Palette className="w-6 h-6" />,
                title: "Brand Customization",
                description: "Match colors and fonts to your brand identity",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "Professional Transitions",
                description: "Eye-catching animations between scenes",
              },
              {
                icon: <Share2 className="w-6 h-6" />,
                title: "Multi-Platform Export",
                description: "Optimized for TikTok, Instagram, and YouTube",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Preview Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold mb-6">
                See the Editor in Action
              </h2>
              <p className="text-gray-600 mb-8">
                Our intuitive video editor makes it easy to create
                professional-looking ads in minutes. No technical skills
                required.
              </p>
              <ul className="space-y-4">
                {[
                  "Clean, modern interface",
                  "Real-time preview",
                  "Drag-and-drop functionality",
                  "One-click export options",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="bg-gray-200 rounded-lg aspect-video w-full overflow-hidden shadow-xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Laptop className="w-24 h-24 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10x</div>
              <div className="text-blue-100">Faster Creation</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-100">Templates</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-blue-100">Social Platforms</div>
            </div>
          </div>
        </div>
      </section>

    {/* Pricing Section */}
    <section className="py-24 bg-white" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Buy credits to generate stunning video ads. No subscriptions. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">5 Credits</h3>
            <p className="text-3xl font-bold mb-4">$5</p>
            <p className="text-gray-600">Perfect for testing or small projects</p>
          </div>
          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">20 Credits</h3>
            <p className="text-3xl font-bold mb-4">$15</p>
            <p className="text-gray-600">Great for regular content creation</p>
          </div>
          <div className="p-6 border rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-2">100 Credits</h3>
            <p className="text-3xl font-bold mb-4">$60</p>
            <p className="text-gray-600">Best value for businesses & agencies</p>
          </div>
        </div>

        <div className="text-center mt-12">
          <a
            href="/sign-in"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started Now
          </a>
        </div>
      </div>
    </section>


      <Footer />
    </div>
  );
}
