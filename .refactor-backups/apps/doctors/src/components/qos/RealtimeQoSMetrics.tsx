'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@altamedica/ui/components/ui/card';
import { Progress } from '@altamedica/ui/components/ui/progress';
import { Badge } from '@altamedica/ui/components/ui/badge';
import { Alert, AlertDescription } from '@altamedica/ui/components/ui/alert';
import { 
  Wifi, WifiOff, Activity, AlertTriangle, 
  TrendingUp, TrendingDown, Signal 
} from 'lucide-react';
import { useWebRTCQoS } from '@altamedica/telemedicine-core/hooks/useWebRTCQoS';

interface RealtimeQoSMetricsProps {
  peerConnection?: RTCPeerConnection;
  sessionId: string;
  compact?: boolean;
  onQualityChange?: (quality: 'excellent' | 'good' | 'fair' | 'poor') => void;
}

export function RealtimeQoSMetrics({ 
  peerConnection, 
  sessionId, 
  compact = false,
  onQualityChange 
}: RealtimeQoSMetricsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  // Use QoS monitoring hook
  const {
    metrics,
    qualityScore,
    qualityIndicator,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  } = useWebRTCQoS({
    sessionId,
    peerConnection,
    interval: 1000, // Update every second
    alertThresholds: {
      latency: 200,
      jitter: 50,
      packetLoss: 5
    }
  });

  // Start monitoring when component mounts
  useEffect(() => {
    if (peerConnection && !isMonitoring) {
      startMonitoring();
    }
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [peerConnection, isMonitoring, startMonitoring, stopMonitoring]);

  // Notify parent of quality changes
  useEffect(() => {
    if (onQualityChange && qualityIndicator) {
      onQualityChange(qualityIndicator);
    }
  }, [qualityIndicator, onQualityChange]);

  const getQualityColor = (indicator: string) => {
    switch(indicator) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-yellow-600';
      case 'fair': return 'text-orange-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionIcon = () => {
    if (!metrics) return <WifiOff className="h-4 w-4 text-gray-400" />;
    
    if (metrics.connection.type === 'stable') {
      return <Wifi className="h-4 w-4 text-green-600" />;
    } else if (metrics.connection.type === 'unstable') {
      return <Wifi className="h-4 w-4 text-yellow-600" />;
    } else {
      return <WifiOff className="h-4 w-4 text-red-600" />;
    }
  };

  if (compact && !isExpanded) {
    return (
      <div 
        className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur rounded-lg cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        {getConnectionIcon()}
        <Badge variant={qualityIndicator === 'excellent' || qualityIndicator === 'good' ? 'success' : 'warning'}>
          {qualityScore ? `${qualityScore}%` : '--'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {metrics?.latency ? `${metrics.latency}ms` : '--'}
        </span>
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Connection Quality
        </h3>
        {compact && (
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Minimize
          </button>
        )}
      </div>

      {/* Quality Score */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Overall Quality</span>
          <span className={`text-lg font-bold ${getQualityColor(qualityIndicator)}`}>
            {qualityScore ? `${qualityScore}%` : '--'}
          </span>
        </div>
        <Progress value={qualityScore || 0} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Poor</span>
          <Badge variant={qualityIndicator === 'excellent' || qualityIndicator === 'good' ? 'default' : 'secondary'}>
            {qualityIndicator ? qualityIndicator.charAt(0).toUpperCase() + qualityIndicator.slice(1) : 'Unknown'}
          </Badge>
          <span>Excellent</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Latency */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Signal className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Latency</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold">
              {metrics?.latency || '--'}
            </span>
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
          {metrics?.latency && metrics.latency > 150 && (
            <TrendingUp className="h-3 w-3 text-yellow-600" />
          )}
        </div>

        {/* Packet Loss */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Packet Loss</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold">
              {metrics?.packetLoss?.toFixed(1) || '0'}
            </span>
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          {metrics?.packetLoss && metrics.packetLoss > 2 && (
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
          )}
        </div>

        {/* Jitter */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Jitter</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold">
              {metrics?.jitter || '--'}
            </span>
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
        </div>

        {/* Bandwidth */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Bandwidth</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold">
              {metrics?.bandwidth?.download ? 
                (metrics.bandwidth.download / 1000).toFixed(1) : '--'}
            </span>
            <span className="text-xs text-muted-foreground">Mbps</span>
          </div>
        </div>
      </div>

      {/* Video/Audio Stats */}
      {(metrics?.video || metrics?.audio) && (
        <div className="space-y-2 pt-2 border-t">
          {metrics.video && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Video</span>
              <span>{metrics.video.resolution} @ {metrics.video.frameRate}fps</span>
            </div>
          )}
          {metrics.audio && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Audio</span>
              <span>{(metrics.audio.bitrate / 1000).toFixed(0)}kbps</span>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center gap-2 pt-2 border-t">
        {getConnectionIcon()}
        <span className="text-xs text-muted-foreground">
          {metrics?.connection?.type ? 
            `Connection: ${metrics.connection.type}` : 
            'Waiting for connection...'}
        </span>
      </div>
    </Card>
  );
}