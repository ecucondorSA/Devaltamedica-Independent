'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useEffect, useRef, useState } from 'react';
import { Brain, Zap, Activity, Shield, Eye, Cpu } from 'lucide-react';

interface MedicalAIRobot3DProps {
  isActive?: boolean;
  mode?: 'analyzing' | 'idle' | 'speaking' | 'processing';
  confidence?: number;
  message?: string;
}

export default function MedicalAIRobot3D({ 
  isActive = false, 
  mode = 'idle', 
  confidence = 95,
  message = "IA Médica Lista"
}: MedicalAIRobot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataStreams, setDataStreams] = useState<Array<{id: number, value: number, delay: number}>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Generate random data streams for visual effect
    const streamTimer = setInterval(() => {
      setDataStreams(prev => [
        ...prev.slice(-20), // Keep only last 20 data points
        {
          id: Date.now(),
          value: Math.random() * 100,
          delay: Math.random() * 2000
        }
      ]);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(streamTimer);
    };
  }, []);

  const getRobotColor = () => {
    switch (mode) {
      case 'analyzing': return 'from-cyan-400 to-blue-500';
      case 'processing': return 'from-purple-400 to-pink-500';
      case 'speaking': return 'from-green-400 to-cyan-500';
      default: return 'from-blue-400 to-purple-500';
    }
  };

  const getRobotAnimation = () => {
    switch (mode) {
      case 'analyzing': return 'animate-pulse';
      case 'processing': return 'animate-spin';
      case 'speaking': return 'animate-bounce';
      default: return '';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] bg-black/60 rounded-2xl border border-cyan-400/30 backdrop-blur-sm overflow-hidden"
    >
      {/* Neural Network Background */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          {/* Dynamic connection lines */}
          {dataStreams.map((stream, index) => (
            <g key={stream.id}>
              <line
                x1={50 + (index * 15) % 300}
                y1={50 + (stream.value * 2)}
                x2={100 + (index * 20) % 250}
                y2={150 + (stream.value * 1.5)}
                stroke={`hsl(${180 + stream.value * 2}, 70%, 60%)`}
                strokeWidth="1"
                opacity={0.6}
                className="animate-pulse"
              />
              <circle
                cx={50 + (index * 15) % 300}
                cy={50 + (stream.value * 2)}
                r="2"
                fill={`hsl(${180 + stream.value * 2}, 70%, 60%)`}
                opacity={0.8}
                className="animate-ping"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Central Robot Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Main Robot Body */}
          <div className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getRobotColor()} ${getRobotAnimation()} border-4 border-white/20 shadow-2xl shadow-cyan-500/20`}>
            
            {/* Robot Face/Core */}
            <div className="absolute inset-8 rounded-full bg-black/60 backdrop-blur-sm border border-cyan-400/50 flex items-center justify-center">
              <div className="relative">
                {mode === 'analyzing' ? (
                  <Brain className="w-16 h-16 text-cyan-400 animate-pulse" />
                ) : mode === 'processing' ? (
                  <Cpu className="w-16 h-16 text-purple-400 animate-spin" />
                ) : mode === 'speaking' ? (
                  <Activity className="w-16 h-16 text-green-400 animate-bounce" />
                ) : (
                  <Brain className="w-16 h-16 text-blue-400" />
                )}
                
                {/* Power indicator */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center animate-pulse">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            {/* Scanning rings */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping"></div>
            <div className="absolute inset-4 rounded-full border border-purple-400/30 animate-pulse"></div>
            <div className="absolute inset-8 rounded-full border border-blue-400/30 animate-ping" style={{animationDelay: '0.5s'}}></div>

            {/* Orbital sensors */}
            <div className="absolute inset-0 animate-spin" style={{animationDuration: '10s'}}>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50">
                <Eye className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50">
                <Shield className="w-3 h-3 text-white absolute top-0.5 left-0.5" />
              </div>
            </div>

            {/* Side sensors */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
          </div>

          {/* Floating Data Particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full animate-float`}
              style={{
                background: `hsl(${180 + i * 30}, 70%, 60%)`,
                top: `${20 + Math.sin(i * 0.5) * 60}%`,
                left: `${20 + Math.cos(i * 0.5) * 60}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${3 + i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Status Display */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-400/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-cyan-400 font-mono text-sm">ALTAMEDICA AI GENESIS v3.7</span>
            <span className="text-green-400 font-mono text-xs">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="text-white font-mono text-sm">{message}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs font-mono">Neural Confidence:</span>
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full transition-all duration-500"
                style={{width: `${confidence}%`}}
              ></div>
            </div>
            <span className="text-cyan-400 text-xs font-mono">{confidence}%</span>
          </div>
        </div>
      </div>

      {/* System Diagnostics */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-purple-400/30">
          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="text-center">
              <div className="text-cyan-400">CPU</div>
              <div className="text-white">{Math.floor(Math.random() * 40 + 60)}%</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400">MEMORY</div>
              <div className="text-white">{Math.floor(Math.random() * 30 + 45)}%</div>
            </div>
            <div className="text-center">
              <div className="text-green-400">NEURAL</div>
              <div className="text-white">{Math.floor(Math.random() * 20 + 80)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Buttons */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 space-y-2">
        <button className="w-12 h-12 bg-cyan-500/20 border border-cyan-400/30 rounded-full flex items-center justify-center hover:bg-cyan-500/30 transition-all">
          <Brain className="w-6 h-6 text-cyan-400" />
        </button>
        <button className="w-12 h-12 bg-purple-500/20 border border-purple-400/30 rounded-full flex items-center justify-center hover:bg-purple-500/30 transition-all">
          <Eye className="w-6 h-6 text-purple-400" />
        </button>
        <button className="w-12 h-12 bg-green-500/20 border border-green-400/30 rounded-full flex items-center justify-center hover:bg-green-500/30 transition-all">
          <Activity className="w-6 h-6 text-green-400" />
        </button>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-20px) rotate(180deg); 
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}