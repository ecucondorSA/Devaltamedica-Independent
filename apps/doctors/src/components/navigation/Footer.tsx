import React from "react";
import Link from "next/link";
import { Heart, Shield, Users, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="ml-2 text-xl font-bold">ALTAMEDICA</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Plataforma integral de gestión médica que conecta profesionales de
              la salud con sus pacientes, facilitando la atención médica de
              calidad.
            </p>
            <div className="flex space-x-4">
              <Link
                href="/contacto"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Phone className="h-5 w-5" />
              </Link>
              <Link
                href="/equipo"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Users className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/citas"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Citas
                </Link>
              </li>
              <li>
                <Link
                  href="/pacientes"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Pacientes
                </Link>
              </li>
              <li>
                <Link
                  href="/perfil"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Mi Perfil
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/ayuda"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Términos de Servicio
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 ALTAMEDICA. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Hecho con</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-gray-400 text-sm">
                para la comunidad médica
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
