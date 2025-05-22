'use client';

import { useState } from 'react';

export default function StudioClient() {
  // overall flow
  const [creating, setCreating] = useState(false);

  // form inputs
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory]         = useState('');
  const [logoFile, setLogoFile]         = useState<File | null>(null);

  // clip search state
  const [clipLoading, setClipLoading] = useState(false);
  const [clips, setClips]             = useState<string[] | null>(null);
  const [clipError, setClipError]     = useState<string | null>(null);

  // render-video state
  const [generating, setGenerating] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [videoUrl, setVideoUrl]         = useState<string | null>(null);

  // Step 1: Start creating
  const handleStart = () => {
    setCreating(true);
    setClips(null);
    setClipError(null);
    setResponseText('');
    setVideoUrl(null);
  };

  // Step 2: Search for clips in storage
  const handleSearchClips = async () => {
    if (!category.trim()) {
      setClipError('Please enter a category to search.');
      return;
    }
    setClipLoading(true);
    setClipError(null);
    setClips(null);

    try {
      const res = await fetch(`/api/clips?category=${encodeURIComponent(category)}`);
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Failed to fetch clips');
      }
      if (!body.clips || body.clips.length === 0) {
        setClipError("Sorry, we don't support your business yet.");
      } else {
        setClips(body.clips);
      }
    } catch (err: any) {
      setClipError(err.message || 'Network error fetching clips');
    } finally {
      setClipLoading(false);
    }
  };

  // Step 3: Generate final video
// inside StudioClient:

// studio-client.tsx — inside StudioClient

const handleGenerate = async () => {
  setGenerating(true);
  setResponseText('');
  setVideoUrl(null);
  try {
    const formData = new FormData();
    formData.append('businessName', businessName);
    formData.append('category',     category);
    // append each clip URL one by one
    (clips ?? []).forEach((url) => {
      formData.append('clips', url);
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    // DEBUG: make sure the browser actually sees these keys
    console.log('📝 Sending FormData entries:');
    for (const [key, val] of formData.entries()) {
      console.log(key, val);
    }

    const res = await fetch('/api/render-video', {
      method: 'POST',
      body: formData,
    });

    const payload = await res
      .json()
      .catch(async () => {
        const text = await res.text();
        throw new Error(`Invalid JSON from server: ${text}`);
      });

    if (!res.ok) {
      setResponseText(payload.error || 'Unknown server error');
    } else {
      setResponseText('✅ Video generated successfully!');
      setVideoUrl(payload.videoUrl);
    }
  } catch (err: any) {
    console.error('Frontend fetch error:', err);
    setResponseText(err.message);
  } finally {
    setGenerating(false);
  }
};



  return (
    <main className="w-full container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Video Studio</h1>

      {/* === Step 0: initial view === */}
      {!creating && (
        <section className="space-y-4">
          <button
            onClick={handleStart}
            className="bg-primary text-white px-4 py-2 rounded-lg"
          >
            Create New Video
          </button>

          <div className="bg-card p-4 border rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-2">My Videos</h2>
            <p className="text-sm text-muted-foreground">
              You haven’t created any videos yet.
            </p>
          </div>
        </section>
      )}

      {/* === Step 1: form to enter details & search clips === */}
      {creating && clips === null && !clipError && !clipLoading && (
        <section className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-4 max-w-md">
          <h2 className="font-semibold text-xl">Video Details</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="border rounded-lg p-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Business Category</label>
            <input
              type="text"
              placeholder="e.g. sneakers, coffee shop"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="border rounded-lg p-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Upload Logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="border rounded-lg p-2"
            />
          </div>

          <button
            onClick={handleSearchClips}
            className="bg-primary text-white px-4 py-2 rounded-lg w-fit"
          >
            Search Clips
          </button>
        </section>
      )}

      {/* === Step 2: clip-loading & errors === */}
      {creating && clipLoading && <p>Loading clips…</p>}
      {creating && clipError && (
        <p className="text-red-600">{clipError}</p>
      )}

      {/* === Step 3: preview clips & generate button === */}
      {creating && clips && (
        <section className="space-y-4">
          <div className="flex gap-4 overflow-x-auto">
            {clips.map((url) => (
              <video
                key={url}
                src={url}
                muted
                autoPlay
                loop
                className="w-36 h-64 object-cover rounded-lg"
              />
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            {generating ? 'Generating…' : 'Generate Video'}
          </button>

          {responseText && (
            <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm">
              {responseText}
            </div>
          )}

          {videoUrl && (
            <video
              src={videoUrl}
              controls
              className="w-full mt-4 rounded-lg border shadow-sm"
            />
          )}
        </section>
      )}
    </main>
  );
}
