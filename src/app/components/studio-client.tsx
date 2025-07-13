'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import SocialShareButtons from "./socialsharebuttons";

interface StoryItem {
  clip: string | null;
  text: string;
  duration: number;
}

interface Storyboard {
  sequence: StoryItem[];
  voiceover: string;
}

export default function StudioClient() {
  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [clipLoading, setClipLoading] = useState<boolean[]>([]);
  const [clips, setClips] = useState<string[] | null>(null);
  const [clipError, setClipError] = useState<(string | null)[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const [storyLoading, setStoryLoading] = useState(false);
  const [storyboardObj, setStoryboardObj] = useState<Storyboard | null>(null);

  const [generating, setGenerating] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [myVideos, setMyVideos] = useState<string[] | null>(null);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  const [theme, setTheme] = useState('minimalist');

  const supabase = useSupabaseClient();
  const user = useUser();
  const [credits, setCredits] = useState<number | null>(null);

  const handleStart = () => {
    if ((credits ?? 0) < 1) {
      alert('You do not have enough credits to create a video.');
      return;
    } 
    setCreating(true);
    setClips(null);
    setClipError([]);
    setClipLoading([]);
    setSuggestion(null);
    setStoryboardObj(null);
    setResponseText('');
    setVideoUrl(null);
  };

  const handleSearchClips = async () => {
    if (!category.trim()) {
      setClipError(['Please enter a category to search.']);
      return;
    }
    setClipLoading([true, true, true]);
    setClipError([null, null, null]);
    setClips(null);
    setSuggestion(null);
    try {
      const res = await fetch(`/api/clips?category=${encodeURIComponent(category)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to fetch clips');
      if (!body.clips?.length) {
        setClipError([`No clips for "${category}".`]);
        setSuggestion(body.suggestion || null);
        setClipLoading([false, false, false]);
      } else {
        setClips(body.clips);
        setClipLoading([false, false, false]);
      }
    } catch (e: any) {
      setClipError([e.message]);
      setClipLoading([false, false, false]);
    }
  };

  const handleReplaceClip = async (idx: number) => {
    if (!clips) return;
    setClipLoading(prev => prev.map((b, i) => i === idx ? true : b));
    setClipError(prev => prev.map((e, i) => i === idx ? null : e));
    try {
      const excludes = clips.filter((_, i) => i !== idx)
        .map(u => `exclude=${encodeURIComponent(u)}`).join('&');
      const res = await fetch(
        `/api/clips?category=${encodeURIComponent(category)}&count=1&${excludes}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to replace clip');
      setClips(prev => prev!.map((c, i) => i === idx ? body.clips[0] : c));
    } catch (e: any) {
      setClipError(prev => prev.map((err, i) => i === idx ? e.message : err));
    } finally {
      setClipLoading(prev => prev.map((b, i) => i === idx ? false : b));
    }
  };

const handleGenerateStoryboard = useCallback(async () => {
  if (!clips) return;
  setStoryLoading(true);
  setStoryboardObj(null);
  setResponseText('');

  console.log('🛰️ Sending storyboard request:', {
    businessName,
    category,
    clipUrls: clips,
  });

  try {
    const res = await fetch('/api/storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName, category, clipUrls: clips }),
    });

    // Read the JSON exactly once
    const payload = await res.json();
    console.log('📜 Storyboard endpoint response:', payload);

    if (!res.ok) {
      throw new Error(payload.error || 'Storyboard generation failed');
    }

    // Parse the returned storyboard (string or object)
    const parsed: Storyboard =
      typeof payload.storyboard === 'string'
        ? JSON.parse(payload.storyboard)
        : payload.storyboard;

    setStoryboardObj(parsed);
  } catch (e: any) {
    setResponseText(e.message || 'Error generating storyboard');
  } finally {
    setStoryLoading(false);
  }
}, [businessName, category, clips]);


  const updateItemText = (idx: number, text: string) => {
    if (!storyboardObj) return;
    const seq = storyboardObj.sequence.map((item, i) =>
      i === idx ? { ...item, text } : item
    );
    const voice = seq.map(i => i.text).join(' ');
    setStoryboardObj({ sequence: seq, voiceover: voice });
  };

  const handleGenerateVideo = async () => {
    setGenerating(true);
    setResponseText('');
    try {
      const form = new FormData();
      form.append('businessName', businessName);
      form.append('category', category);
      form.append('theme', theme);
      clips?.forEach((u) => form.append('clips', u));
     // ✏️ Send the edited storyboard JSON
      if (storyboardObj) {
      form.append('storyboard', JSON.stringify(storyboardObj.sequence));
      form.append('voiceover', storyboardObj.voiceover);
      
    }
      if (logoFile) form.append('logo', logoFile);
      const res = await fetch('/api/render-video', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideoUrl(data.videoUrl);
      setResponseText('✅ Video generated successfully!');
    console.log('📡 Calling use_one_credit with user ID:', user?.id);

    const { data: newCredits, error: creditError } = await supabase.rpc('use_one_credit', {
      p_user_id: user?.id,
    });
    if (creditError != null || typeof newCredits !== 'number') {
      console.error('Failed to deduct credit:', creditError);
      setResponseText('⚠️ Video was created but credit deduction failed.');
    } else {
      setCredits(newCredits);
    }
    console.log('✅ Updated credits:', newCredits);
    console.log('📢 responseText:', responseText);

    } catch (e: any) {
      setResponseText(e.message);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setVideosLoading(true);
    fetch('/api/my-videos')
      .then(r => r.json().then(b => {
        if (!r.ok) throw new Error(b.error || 'Failed to fetch videos');
        setMyVideos(b.videos);
      }))
      .catch(e => setVideosError(e.message))
      .finally(() => setVideosLoading(false));
  }, [user]);

  useEffect(() => {
  const fetchCredits = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();
    if (error) {
      console.error('Failed to fetch credits:', error);
      return;
    }
    setCredits(data.credits);
  };

  fetchCredits();
  }, [user]);

  return (
    <main className="w-full container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Video Studio</h1>

      {!creating && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">Credits: {credits ?? 'Loading...'}</p>
          <button onClick={handleStart} className="bg-primary text-white px-4 py-2 rounded-lg">
            Create New Video
          </button>
          <div className="bg-card p-4 border rounded-lg shadow-sm">
            <h2 className="font-semibold text-lg mb-2">My Videos</h2>
            {videosLoading && <p>Loading your videos…</p>}
            {videosError && <p className="text-red-600">Error loading videos: {videosError}</p>}
            {myVideos && myVideos.length === 0 && (
              <p className="text-sm text-muted-foreground">You haven’t created any videos yet.</p>
            )}
            {myVideos && myVideos.length > 0 && (
              <div className="flex gap-4 overflow-x-auto">
                {myVideos.map(url => (
                  <video key={url} src={url} controls className="w-36 h-64 object-cover rounded-lg" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {creating && !clips && (
        <section className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-4 max-w-md">
          <h2 className="font-semibold text-xl">Video Details</h2>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="border rounded-lg p-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Business Category</label>
            <input
              type="text"
              placeholder="e.g. sneakers, coffee shop"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="border rounded-lg p-2"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Theme</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >                
                <option value="minimalist">Minimalist</option>
                <option value="bold">Bold & Colorful</option>
                <option value="typewriter">Typewriter</option>
              </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Upload Logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setLogoFile(e.target.files?[0]:null)}
              className="border rounded-lg p-2"
            />
          </div>
          <button onClick={handleSearchClips} className="bg-primary text-white px-4 py-2 rounded-lg w-fit">
            Search Clips
          </button>
          {clipError.some(Boolean) && (
            <div className="text-red-600 space-y-2">
              {clipError.map((err, i) => err && <p key={i}>{err}</p>)}
              {suggestion && (
                <div className="text-yellow-700 bg-yellow-100 p-2 rounded-md">
                  Did you mean{' '}
                  <button onClick={()=>{setCategory(suggestion);handleSearchClips();}} className="underline font-semibold">
                    {suggestion}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {creating && clips && (
        <>
          <section className="space-y-4">
            <div className="flex gap-4 overflow-x-auto">
              {clips.map((url, i) => (
                <div key={i} className="flex flex-col items-center">
                  <video src={url} muted autoPlay loop className="w-36 h-64 object-cover rounded-lg" />
                  <button
                    onClick={() => handleReplaceClip(i)}
                    disabled={clipLoading[i]}
                    className="mt-2 px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                  >
                    {clipLoading[i] ? 'Loading…' : 'New Clip'}
                  </button>
                  {clipError[i] && <p className="text-red-500 text-sm">{clipError[i]}</p>}
                </div>
              ))}
            </div>
            {!storyboardObj && (
              <button
                onClick={handleGenerateStoryboard}
                disabled={storyLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                {storyLoading ? 'Generating Text…' : 'Generate Text'}
              </button>
            )}
          </section>
          {storyboardObj && (
            <section className="bg-card p-4 border rounded-lg shadow-sm">
              <h2 className="font-semibold text-lg mb-2">Storyboard Preview</h2>
              {storyboardObj.sequence.map((itm, i) => (
                <div key={i} className="mb-2">
                  <p className="text-sm font-medium">{itm.clip ?? 'Text Slide'}</p>
                  <input
                    type="text"
                    value={itm.text}
                    onChange={e => updateItemText(i, e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}
              <h2 className="font-semibold text-lg mb-2">Voiceover</h2>
              <textarea
                rows={4}
                value={storyboardObj.voiceover}
                onChange={e => setStoryboardObj({ sequence: storyboardObj.sequence, voiceover: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setStoryboardObj(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Regenerate Text
                </button>
                <button
                  onClick={handleGenerateVideo}
                  disabled={generating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  {generating ? 'Rendering Video…' : 'Generate Video'}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {responseText && <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm">{responseText}</div>}

        {videoUrl && (
          <>
            <video src={videoUrl} controls className="w-full max-w-md rounded-lg" />
            <SocialShareButtons videoUrl={videoUrl} />
          </>
        )}

    </main>
  );
}
