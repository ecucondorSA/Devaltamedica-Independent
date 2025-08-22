/// <reference types="@react-three/fiber" />
import React from 'react';
import type { AltaEmotion, AltaState } from '../types/alta.types';

export interface AltaAvatar3DProps {
  emotion?: AltaEmotion;
  state?: AltaState;
  scale?: number;
  position?: [number, number, number];
  onLoaded?: () => void;
  className?: string;
}

export function AltaAvatar3D({
  emotion = 'neutral',
  state = 'idle',
  className = ''
}: AltaAvatar3DProps) {
  return (
    <div className={`alta-avatar-3d-placeholder ${className}`}>
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <p>3D Avatar Placeholder</p>
        <p>Emotion: {emotion}</p>
        <p>State: {state}</p>
      </div>
    </div>
  );
}

export function AltaAvatar3DMinimal({
  emotion = 'neutral',
  state = 'idle',
  className = ''
}: AltaAvatar3DProps) {
  return <AltaAvatar3D emotion={emotion} state={state} className={className} />;
}
