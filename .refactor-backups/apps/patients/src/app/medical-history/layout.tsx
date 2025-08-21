import { Button, Card, Input } from '@altamedica/ui';
import React from "react";

export default function MedicalHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Historia Médica</h1>
        <div className="bg-white rounded-xl shadow p-4">{children}</div>
      </div>
    </div>
  );
}
