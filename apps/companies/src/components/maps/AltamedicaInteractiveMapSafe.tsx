"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Building, Heart, MapPin, Search, Star } from "lucide-react";

interface DoctorLocation {
  id: string;
  name: string;
  specialty: string;
  company: string;
  location: { lat: number; lng: number; city: string; state: string };
  status: "active" | "busy" | "offline";
  rating: number;
  experience: string;
  consultationFee?: string;
  phone?: string;
}

const mockDoctors: DoctorLocation[] = [
  {
    id: "1",
    name: "Dr. María Elena Fernández",
    specialty: "Cardiología Empresarial",
    company: "Hospital Italiano - ALTAMEDICA",
    location: {
      lat: -34.5922,
      lng: -58.3731,
      city: "Buenos Aires",
      state: "CABA",
    },
    status: "active",
    rating: 4.9,
    experience: "15 años de experiencia",
    consultationFee: "$8,500",
    phone: "+54 11 4959-0200",
  },
  {
    id: "2",
    name: "Dr. Carlos Alberto Mendoza",
    specialty: "Medicina Ocupacional",
    company: "Hospital Alemán - ALTAMEDICA",
    location: {
      lat: -34.5844,
      lng: -58.4034,
      city: "Buenos Aires",
      state: "CABA",
    },
    status: "active",
    rating: 4.8,
    experience: "12 años de experiencia",
    consultationFee: "$7,200",
    phone: "+54 11 4827-7000",
  },
  {
    id: "3",
    name: "Dra. Ana Sofía López",
    specialty: "Neurología Corporativa",
    company: "Sanatorio Otamendi - ALTAMEDICA",
    location: {
      lat: -34.5867,
      lng: -58.3956,
      city: "Buenos Aires",
      state: "CABA",
    },
    status: "busy",
    rating: 4.9,
    experience: "18 años de experiencia",
    consultationFee: "$9,800",
    phone: "+54 11 4821-1221",
  },
  {
    id: "4",
    name: "Dr. Roberto Domínguez",
    specialty: "Medicina Preventiva",
    company: "Hospital Británico - ALTAMEDICA",
    location: {
      lat: -34.6037,
      lng: -58.3816,
      city: "Buenos Aires",
      state: "CABA",
    },
    status: "active",
    rating: 4.7,
    experience: "10 años de experiencia",
    consultationFee: "$6,500",
    phone: "+54 11 4309-6400",
  },
  {
    id: "5",
    name: "Dra. Lucía Morales",
    specialty: "Salud Ocupacional",
    company: "Clínica Bazterrica - ALTAMEDICA",
    location: {
      lat: -34.5789,
      lng: -58.4123,
      city: "Buenos Aires",
      state: "CABA",
    },
    status: "active",
    rating: 4.8,
    experience: "14 años de experiencia",
    consultationFee: "$7,800",
    phone: "+54 11 4362-0300",
  },
];

export default function AltamedicaInteractiveMapSafe() {
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorLocation | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    // Simular carga del mapa
    const timer = setTimeout(() => setIsMapReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!searchQuery) return mockDoctors;
    const query = searchQuery.toLowerCase();
    return mockDoctors.filter((doctor) => {
      const searchableText =
        `${doctor.name} ${doctor.specialty} ${doctor.company}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [searchQuery]);

  const handleDoctorSelect = useCallback((doctor: DoctorLocation) => {
    setSelectedDoctor(doctor);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Disponible";
      case "busy":
        return "Ocupado";
      case "offline":
        return "Offline";
      default:
        return "Desconocido";
    }
  };

  if (!isMapReady) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-blue-50 to-sky-100 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <MapPin className="absolute inset-0 m-auto w-8 h-8 text-blue-600 opacity-50" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Cargando Mapa Médico
            </p>
            <p className="text-sm text-gray-500">
              Conectando con la red ALTAMEDICA...
            </p>
          </div>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Header del Mapa */}
      <div className="flex items-center justify-between p-6 mb-6 border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl">
        <div className="flex items-center">
          <div className="p-3 mr-4 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Red Médica ALTAMEDICA
            </h3>
            <p className="text-gray-600">
              {filteredDoctors.length} de {mockDoctors.length} especialistas
              disponibles
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar especialista..."
              className="py-3 pl-12 pr-4 text-sm bg-white border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar especialista"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Área del Mapa - Simulación Visual */}
        <div className="lg:col-span-2">
          <div className="relative h-[600px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl overflow-hidden border-2 border-blue-200 shadow-lg">
            {/* Simulación visual del mapa */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-neutral-50 to-blue-50">
              {/* Grid para simular calles */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full h-px bg-gray-400"
                    style={{ top: `${i * 10}%` }}
                  />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full w-px bg-gray-400"
                    style={{ left: `${i * 10}%` }}
                  />
                ))}
              </div>

              {/* Marcadores de médicos */}
              {filteredDoctors.map((doctor, index) => {
                const x = 20 + ((index * 15) % 60);
                const y = 20 + Math.floor(index / 4) * 20;

                return (
                  <div
                    key={doctor.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div
                      className={`w-4 h-4 ${getStatusColor(doctor.status)} rounded-full border-2 border-white shadow-lg`}
                    ></div>
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                      <div className="font-semibold">{doctor.name}</div>
                      <div className="text-gray-600">{doctor.specialty}</div>
                    </div>
                  </div>
                );
              })}

              {/* Leyenda */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
                <div className="text-sm font-semibold mb-2">
                  Estado de Especialistas
                </div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs">Disponible</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-xs">Ocupado</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                    <span className="text-xs">Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Información */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[600px] overflow-y-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Especialistas Cercanos
            </h4>

            {selectedDoctor ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900">
                      {selectedDoctor.name}
                    </h5>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedDoctor.status === "active"
                          ? "bg-green-100 text-green-800"
                          : selectedDoctor.status === "busy"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getStatusText(selectedDoctor.status)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedDoctor.specialty}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedDoctor.company}
                  </p>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedDoctor.location.city},{" "}
                    {selectedDoctor.location.state}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">
                        {selectedDoctor.rating}
                      </span>
                    </div>
                    {selectedDoctor.consultationFee && (
                      <span className="text-sm font-semibold text-green-600">
                        {selectedDoctor.consultationFee}
                      </span>
                    )}
                  </div>
                  {selectedDoctor.phone && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        {selectedDoctor.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Selecciona un especialista en el mapa para ver detalles</p>
              </div>
            )}

            <div className="mt-6">
              <h5 className="font-semibold text-gray-900 mb-3">
                Todos los Especialistas
              </h5>
              <div className="space-y-3">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedDoctor?.id === doctor.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                    }`}
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-900 text-sm">
                        {doctor.name}
                      </h6>
                      <div
                        className={`w-2 h-2 ${getStatusColor(doctor.status)} rounded-full`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {doctor.specialty}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 mr-1" />
                        <span className="text-xs font-medium">
                          {doctor.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {doctor.location.city}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
