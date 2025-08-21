"use client";

import React from "react";
import { Container } from "@/components/layout/Container";
import { Heart, Stethoscope, Building2, Star } from "lucide-react";

interface TestimonialProps {
  readonly name: string;
  readonly role: string;
  readonly quote: string;
  readonly icon: React.ComponentType<any>;
  readonly bgColor: string;
}

interface TestimonialsProps {
  className?: string;
}

const TESTIMONIALS: readonly TestimonialProps[] = [
  {
    name: "María González",
    role: "Paciente",
    quote: "Encontré al cardiólogo perfecto en menos de 5 minutos.",
    icon: Heart,
    bgColor: "bg-blue-500",
  },
  {
    name: "Dr. Carlos Ruiz",
    role: "Cardiólogo",
    quote: "Las consultas por video han revolucionado mi práctica.",
    icon: Stethoscope,
    bgColor: "bg-green-500",
  },
  {
    name: "Ana Torres",
    role: "Directora Clínica",
    quote: "Encontramos los mejores especialistas para nuestra clínica.",
    icon: Building2,
    bgColor: "bg-purple-500",
  },
] as const;

const TestimonialCard = React.memo<TestimonialProps>(
  ({ name, role, quote, icon: Icon, bgColor }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-all duration-200 hover:bg-white/15">
      <div className="flex items-center mb-3">
        <div
          className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center mr-3`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-sm text-white">{name}</div>
          <div className="text-slate-300 text-xs">{role}</div>
        </div>
      </div>
      <p className="text-slate-300 mb-3 text-sm">"{quote}"</p>
      <div className="flex text-yellow-400">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-3 w-3 fill-current" />
        ))}
      </div>
    </div>
  )
);

TestimonialCard.displayName = "TestimonialCard";

const Testimonials: React.FC<TestimonialsProps> = ({ className = "" }) => {
  return (
    <section className={`py-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white ${className}`}>
      <Container size="2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            Lo que Dicen Nuestros Usuarios
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Testimonials;
