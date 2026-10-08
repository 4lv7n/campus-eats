'use client';

import { useState } from 'react';

const EMOJI: Record<string, string> = {
  wraps: '🌯', plates: '🍽️', coffee: '☕', tea: '🍵', snacks: '🥪', drinks: '🥤', desserts: '🍰',
};
const COLORS = ['from-orange-200 to-amber-100', 'from-rose-200 to-orange-100', 'from-amber-200 to-yellow-100', 'from-lime-200 to-emerald-100'];

// Shows the real image if there is one, otherwise a colourful emoji placeholder.
export default function FoodImage({ src, name, category = '', className = '' }: { src?: string; name: string; category?: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
  }
  const emoji = EMOJI[category.toLowerCase()] ?? '🍴';
  const color = COLORS[name.length % COLORS.length];
  return (
    <div role="img" aria-label={name} className={`flex items-center justify-center bg-gradient-to-br ${color} ${className}`}>
      <span className="text-5xl">{emoji}</span>
    </div>
  );
}
