"use client";

import React from "react";
import { Container } from "@/components/layout/Container";
import { Users, Stethoscope, Clock, Shield } from "lucide-react";

interface StatItem {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  color: string;
}

interface StatsBarProps {
  className?: string;
}

const STATS: StatItem[] = [
  {
    icon: Users,
    value: "12,547",
    label: "Pacientes Conectados",
    color: "text-sky-600",
  },
  {
    icon: Stethoscope,
    value: "1,820",
    label: "Médicos Disponibles",
    color: "text-emerald-600",
  },
  {
    icon: Clock,
    value: "15+",
    label: "Años de Historial",
    color: "text-green-600",
  },
  {
    icon: Shield,
    value: "99.9%",
    label: "Seguridad Garantizada",
    color: "text-purple-600",
  },
];

const StatsBar: React.FC<StatsBarProps> = ({ className = "" }) => {
  return (
    <section className={`py-8 bg-white border-b border-slate-100 ${className}`}>
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((stat, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default StatsBar;
