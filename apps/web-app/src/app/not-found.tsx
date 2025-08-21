'use client'
import Link from 'next/link'

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Página no encontrada | AltaMedica',
  description: 'La página que buscas no existe. Encuentra nuestros servicios médicos principales.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-50 to-primary-100">
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Error 404 */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-sky-600 mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Página no encontrada
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Lo sentimos, la página que buscas no existe o ha sido movida. 
              Te ayudamos a encontrar lo que necesitas.
            </p>
          </div>

          {/* Servicios disponibles */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Nuestros Servicios Disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Portal de Doctores */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-center">
                <div className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Portal de Doctores
                  </h4>
                  <p className="text-gray-600 mb-4 text-sm">
                    Gestión de pacientes y expedientes médicos
                  </p>
                  <Link 
                    href="/doctores"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full"
                  >
                    Acceder
                  </Link>
                </div>
              </div>

              {/* Portal de Pacientes */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-center">
                <div className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Portal de Pacientes
                  </h4>
                  <p className="text-gray-600 mb-4 text-sm">
                    Acceso a historial médico y citas
                  </p>
                  <Link 
                    href="/pacientes"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full"
                  >
                    Acceder
                  </Link>
                </div>
              </div>

              {/* Portal de Empresas */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-center">
                <div className="p-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Portal de Empresas
                  </h4>
                  <p className="text-gray-600 mb-4 text-sm">
                    Salud ocupacional y bienestar corporativo
                  </p>
                  <Link 
                    href="/companies"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 w-full"
                  >
                    Acceder
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-500 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Volver al Inicio
            </Link>
            <Link 
              href="/anamnesis-juego"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-sky-600 bg-white border-2 border-sky-500 rounded-lg hover:bg-sky-50 transform hover:scale-105 transition-all duration-200"
            >
              Jugar Anamnesis
            </Link>
          </div>

          {/* Información adicional */}
          <div className="mt-12 p-6 bg-white rounded-xl shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Necesitas ayuda?
            </h4>
            <p className="text-gray-600 mb-4">
              Si no encuentras lo que buscas, puedes:
            </p>
            <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-sky-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Usar la barra de navegación superior
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-sky-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Explorar nuestros servicios principales
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-sky-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Contactar con nuestro equipo de soporte
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}