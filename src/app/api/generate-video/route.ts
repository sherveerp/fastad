import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import axios from "axios";

export async function POST(req: Request) {
  console.log("💥 generate-video API route called");

  const formData = await req.formData();
  const businessName = formData.get("businessName") as string;
  const category = formData.get("category") as string;
  const font = formData.get("font") as string;
  const logo = formData.get("logo") as File | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let logoUrl = "";

  // Upload logo if provided
  if (logo) {
    try {
      const arrayBuffer = await logo.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filePath = `logos/${uuidv4()}-${logo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("user-logos")
        .upload(filePath, buffer, {
          contentType: logo.type,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from("user-logos").getPublicUrl(filePath);
        logoUrl = data.publicUrl;
      }
    } catch (err) {
      console.error("Logo upload error:", err);
    }
  }

  // Construct prompt
  let prompt = `Create a professional promotional video for a business.\n\n`;
  prompt += `Business Name: ${businessName}\n`;
  prompt += `Business Category: ${category}\n`;
  prompt += `Preferred Font: ${font}\n`;
  if (logoUrl) {
    prompt += `Logo URL: ${logoUrl}\n`;
  }
  prompt += `\nThe video should feel engaging and relevant to the business type. Include text animations using the selected font, and incorporate branding elements where possible.`;

  // Send to Gemini (AI Studio: chat-bison-001 + generateMessage)
  let geminiOutput = "";
  try {
    console.log("Sending prompt to Gemini:\n", prompt);

    const geminiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/chat-bison-001:generateMessage",
      {
        prompt: {
          messages: [
            {
              author: "user",
              content: prompt,
            },
          ],
        },
        temperature: 0.7,
        candidateCount: 1,
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY,
        },
      }
    );

    geminiOutput = geminiRes.data.candidates?.[0]?.content || "No output from Gemini";
    console.log("Gemini response text:", geminiOutput);
  } catch (err: any) {
    console.error("Gemini API error:", err?.response?.data || err.message);
    return NextResponse.json(
      { error: err?.response?.data?.error?.message || "Failed to generate content" },
      { status: 500 }
    );
  }

  // Save to Supabase
  const { error: dbError } = await supabase.from("video_prompts").insert({
    user_id: user.id,
    business_name: businessName,
    category,
    font,
    logo_url: logoUrl,
    prompt,
    gemini_response: geminiOutput,
  });

  if (dbError) {
    console.error("DB insert error:", dbError.message);
  }

  return NextResponse.json({ result: geminiOutput, prompt });
}
