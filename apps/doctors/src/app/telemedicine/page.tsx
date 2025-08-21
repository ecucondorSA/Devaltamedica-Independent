"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@altamedica/ui";
import { Beaker, Video } from "lucide-react";
import Link from "next/link";

export default function TelemedicineHomeMinimal() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Video className="w-6 h-6 text-blue-600" />
              Telemedicina (MVP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Esta versión mínima incluye una sala simple de videollamada y chat para pruebas.
            </p>
            <div className="flex gap-3">
              <Link href="/telemedicine/test">
                <Button>
                  <Beaker className="w-4 h-4 mr-2" />
                  Abrir Demo Rápida
                </Button>
              </Link>
        <Link href="/telemedicine/room/demo-room">
                <Button variant="outline">
                  <Video className="w-4 h-4 mr-2" />
          Unirse a Sala demo-room
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Nota: requiere servidor de señalización local (ws/socket.io) para funcionar.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}