'use client';

import { useState, useEffect } from 'react';

const PARTICLE_COUNT = 130;

const SPORTS_ICONS = ['⚽', '🏀', '🎾', '🏐', '🥏'] as const;

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  icon: (typeof SPORTS_ICONS)[number];
};

export function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const list: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      list.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 14 + Math.random() * 14,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 12,
        opacity: 0.5 + Math.random() * 0.35,
        icon: SPORTS_ICONS[Math.floor(Math.random() * SPORTS_ICONS.length)],
      });
    }
    setParticles(list);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-1"
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute flex items-center justify-center particle-float particle-sports"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.icon}
        </div>
      ))}
    </div>
  );
}
