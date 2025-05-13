'use client';

import { useState } from "react";

export default function StudioClient() {
  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("restaurants");
  const [font, setFont] = useState("helvetica");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateClick = () => setCreating(true);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseText("");

    try {
      const formData = new FormData();
      formData.append("businessName", businessName);
      formData.append("category", category);
      formData.append("font", font);
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch("/api/generate-video", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("API response:", data);

      if (!res.ok) {
        setResponseText(data.error || "Unknown error occurred.");
        return;
      }

        const text =
        data.result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from Gemini.";

        setResponseText(`Prompt:\n${data.prompt}\n\nResponse:\n${data.result}`);

    }  catch (err: any) {
        console.error("Frontend fetch error:", err);

        // Try extracting error details
        if (err instanceof TypeError && err.message === "Failed to fetch") {
            setResponseText("Network error: Could not connect to server.");
        } else {
        setResponseText(`Request failed: ${err.message || "Unknown error"}`);
        }


    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        <h1 className="text-3xl font-bold">Video Studio</h1>

        <section className="flex flex-col gap-4">
          <button
            onClick={handleCreateClick}
            className="bg-primary text-white px-4 py-2 rounded-lg w-fit hover:bg-primary/90 transition"
          >
            Create New Video
          </button>

          <div className="bg-card p-4 border rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-2">My Videos</h2>
            <p className="text-sm text-muted-foreground">No videos yet.</p>
          </div>
        </section>

        {creating && (
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-4">Video Details</h2>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Business Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="restaurants">Restaurants</option>
                  <option value="retail store">Retail Store</option>
                  <option value="car wash">Car Wash</option>
                  <option value="handyman">Handyman</option>
                  <option value="landscaper">Landscaper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Font Type</label>
                <select
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="helvetica">Helvetica</option>
                  <option value="avenir">Avenir</option>
                  <option value="univers">Univers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Upload Logo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-4 py-2 rounded-lg w-fit hover:bg-primary/90 transition"
              >
                {loading ? "Generating..." : "Generate Video"}
              </button>
            </form>

            {responseText && (
              <div className="mt-6 p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm">
                {responseText}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
