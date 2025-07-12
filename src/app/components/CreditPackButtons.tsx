// src/app/components/CreditPackButtons.tsx
'use client'

export function CreditPackButtons() {
  const handleCheckout = async (packId: string) => {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  return (
    <div className="flex gap-4">
      {['starter', 'standard', 'pro'].map((packId) => (
        <button
          key={packId}
          onClick={() => handleCheckout(packId)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          Buy {packId === 'starter' ? '5' : packId === 'standard' ? '20' : '100'} Credits
        </button>
      ))}
    </div>
  );
}
