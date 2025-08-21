/**
 * 🏥 ALTA AVATAR 3D
 * Componente de visualización 3D para Alta
 * Desarrollado por Dr. Eduardo Marques (Medicina-UBA)
 */

import {
  Environment,
  Float,
  Html,
  OrbitControls,
  Sparkles,
  useAnimations,
  useGLTF,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { AltaEmotion, AltaState } from '../types/alta.types';

export interface AltaAvatar3DProps {
  modelPath?: string;
  emotion?: AltaEmotion;
  state?: AltaState;
  isSpeaking?: boolean;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  enableControls?: boolean;
  showEnvironment?: boolean;
  className?: string;
}

/**
 * Componente del modelo 3D de Alta
 */
function AltaModel({
  modelPath = '/models/alta-avatar.glb',
  emotion = 'neutral',
  state = 'idle',
  isSpeaking = false,
  scale = 1,
  position = [0, -1, 0],
  rotation = [0, 0, 0],
}: Partial<AltaAvatar3DProps>) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions, names } = useAnimations(animations, group);

  // Estado para animaciones
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [blinkTimer, setBlinkTimer] = useState(0);

  // Mapeo de emociones a animaciones
  const emotionAnimationMap: Record<AltaEmotion, string> = {
    neutral: 'idle',
    empathetic: 'nod',
    concerned: 'tilt_head',
    happy: 'smile',
    focused: 'lean_forward',
    urgent: 'alert',
  };

  // Mapeo de estados a animaciones
  const stateAnimationMap: Record<AltaState, string> = {
    idle: 'idle',
    listening: 'listening',
    thinking: 'thinking',
    speaking: 'talking',
    analyzing: 'processing',
    alert: 'alert',
  };

  // Cambiar animación según emoción y estado
  useEffect(() => {
    let targetAnimation = stateAnimationMap[state];

    // Si está hablando, priorizar animación de habla
    if (isSpeaking) {
      targetAnimation = 'talking';
    }

    // Cambiar animación si existe
    if (actions[targetAnimation]) {
      // Detener animaciones anteriores
      Object.values(actions).forEach((action) => action?.stop());

      // Iniciar nueva animación
      actions[targetAnimation]?.reset().fadeIn(0.5).play();
      setCurrentAnimation(targetAnimation);
    }
  }, [state, emotion, isSpeaking, actions]);

  // Animación de parpadeo
  useFrame((state, delta) => {
    if (!group.current) return;

    // Parpadeo periódico
    setBlinkTimer((prev) => {
      const newTimer = prev + delta;
      if (newTimer > 3 + Math.random() * 2) {
        // Ejecutar parpadeo
        if (actions['blink']) {
          actions['blink'].reset().play();
        }
        return 0;
      }
      return newTimer;
    });

    // Movimiento sutil de respiración
    if (group.current) {
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      group.current.scale.y = scale * breathingScale;
    }

    // Seguimiento suave con la mirada (si no hay controles)
    if (!isSpeaking && group.current) {
      const targetRotation = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetRotation,
        0.1,
      );
    }
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />

      {/* Indicador de estado */}
      {state === 'thinking' && (
        <Sparkles count={20} scale={2} size={2} speed={0.5} color="#00bfff" opacity={0.5} />
      )}

      {/* Indicador de habla */}
      {isSpeaking && (
        <Html position={[0, 2, 0]} center>
          <div className="flex items-center space-x-1">
            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-100" />
            <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-200" />
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Fallback mientras carga el modelo
 */
function LoadingAvatar() {
  return (
    <Html center>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-600">Cargando Alta...</p>
      </div>
    </Html>
  );
}

/**
 * Componente principal del Avatar 3D
 */
export function AltaAvatar3D({
  modelPath = '/models/alta-avatar.glb',
  emotion = 'neutral',
  state = 'idle',
  isSpeaking = false,
  scale = 1,
  position = [0, -1, 0],
  rotation = [0, 0, 0],
  enableControls = true,
  showEnvironment = true,
  className = '',
}: AltaAvatar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Estado de emoción con transición suave
  const emotionColors: Record<AltaEmotion, string> = {
    neutral: '#87CEEB', // Sky blue
    empathetic: '#98FB98', // Pale green
    concerned: '#FFE4B5', // Moccasin
    happy: '#FFD700', // Gold
    focused: '#9370DB', // Medium purple
    urgent: '#FF6B6B', // Red
  };

  const currentColor = emotionColors[emotion];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gradient-to-b from-blue-50 to-white rounded-lg overflow-hidden ${className}`}
    >
      {/* Header con información de Alta */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg">
          <h3 className="text-sm font-semibold text-gray-800">Alta</h3>
          <p className="text-xs text-gray-600">Asistente Médica</p>
          <div className="flex items-center mt-1">
            <div
              className="w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-xs text-gray-500 capitalize">{emotion}</span>
          </div>
        </div>
      </div>

      {/* Canvas 3D */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        onCreated={() => setIsLoaded(true)}
      >
        {/* Iluminación */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Luz de emoción */}
        <pointLight position={[0, 2, 2]} intensity={0.3} color={currentColor} />

        {/* Modelo de Alta */}
        <Suspense fallback={<LoadingAvatar />}>
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
            <AltaModel
              modelPath={modelPath}
              emotion={emotion}
              state={state}
              isSpeaking={isSpeaking}
              scale={scale}
              position={position}
              rotation={rotation}
            />
          </Float>
        </Suspense>

        {/* Controles orbitales */}
        {enableControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2}
            autoRotate={state === 'idle'}
            autoRotateSpeed={0.5}
          />
        )}

        {/* Entorno */}
        {showEnvironment && <Environment preset="city" background={false} />}

        {/* Piso con sombras */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
      </Canvas>

      {/* Indicador de carga */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-sm text-gray-600">Inicializando Alta...</p>
              <p className="text-xs text-gray-500 mt-1">Desarrollada por Dr. Eduardo Marques</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Precargar el modelo
useGLTF.preload('/models/alta-avatar.glb');

export default AltaAvatar3D;
