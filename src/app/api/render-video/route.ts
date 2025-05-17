import { NextResponse } from "next/server";
import { generateVideo } from "../../../../render";

export async function POST(req: Request) {
  const formData = await req.formData();
  const businessName = formData.get("businessName") as string;
  const font = formData.get("font") as string;
  const logoUrl = formData.get("logo") as string;

  try {
    const { buffer } = await generateVideo({ businessName, font, logoUrl });
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'video/mp4' }
    });
  } catch (err) {
    return NextResponse.json({ error: "Video generation failed." }, { status: 500 });
  }
}
