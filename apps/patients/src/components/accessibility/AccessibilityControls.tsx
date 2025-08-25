'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ZoomIn, ZoomOut, Palette, Settings, X, Check, RotateCcw } from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { ButtonCorporate } from '@altamedica/ui';

export default function AccessibilityControls() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg border p-4 shadow-lg">
        <div className="text-center">
          <h3 className="mb-2 text-sm font-medium text-gray-900">
            Controles temporalmente deshabilitados
          </h3>
          <p className="text-xs text-gray-600">Esta funcionalidad estará disponible próximamente</p>
        </div>
      </div>
    </div>
  );
}
