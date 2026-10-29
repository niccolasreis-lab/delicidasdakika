'use client';

import {useEffect, useSyncExternalStore} from 'react';

type MotionMode = 'desativadas' | 'suaves' | 'completas';
const STORAGE_KEY = 'kika-motion-v1';
const CHANGE_EVENT = 'kika-motion-change';
let fallbackMode: MotionMode = 'suaves';
const modes: MotionMode[] = ['desativadas', 'suaves', 'completas'];

function snapshot(): MotionMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return modes.includes(stored as MotionMode) ? stored as MotionMode : 'suaves';
  } catch {
    return fallbackMode;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

const serverSnapshot = (): MotionMode => 'suaves';

export function motionScrollBehavior(): ScrollBehavior {
  return snapshot() === 'desativadas' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto' : 'smooth';
}

export function MotionController() {
  const mode = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    document.documentElement.dataset.kikaMotion = mode;
  }, [mode]);
  return null;
}

function choose(next: MotionMode) {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Restricted storage: still apply the choice for this page view.
      fallbackMode = next;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

export function MotionControls() {
  const mode = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return <section className="motion-settings" aria-label="Preferência de animações">
    <h3>Animações da interface</h3>
    <p>Escolha como prefere navegar. A redução de movimento do seu aparelho sempre será respeitada.</p>
    <div className="motion-options" role="group" aria-label="Modo de animação">
      {modes.map(value => <button type="button" key={value}
        aria-pressed={mode === value} onClick={() => choose(value)}>
        {value === 'desativadas' ? 'Desativadas' : value === 'suaves' ? 'Suaves' : 'Completas'}
      </button>)}
    </div>
  </section>;
}
