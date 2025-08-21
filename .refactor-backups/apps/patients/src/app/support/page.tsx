"use client";

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: "general" | "technical" | "medical" | "billing";
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"faq" | "contact" | "tickets">(
    "faq"
  );
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "¿Cómo puedo agendar una cita médica?",
      answer:
        'Puedes agendar una cita desde la sección "Mis Citas" en tu dashboard. Haz clic en "Nueva Cita" y selecciona el especialista, fecha y hora que prefieras.',
      category: "general",
    },
    {
      id: "2",
      question: "¿Cómo accedo a mis resultados de laboratorio?",
      answer:
        'Los resultados de laboratorio están disponibles en la sección "Resultados de Laboratorio". Los resultados se publican automáticamente una vez que estén listos.',
      category: "medical",
    },
    {
      id: "3",
      question: "¿Puedo cancelar o reprogramar una cita?",
      answer:
        'Sí, puedes cancelar o reprogramar tu cita hasta 24 horas antes de la fecha programada desde la sección "Mis Citas".',
      category: "general",
    },
    {
      id: "4",
      question: "¿Cómo funciona la telemedicina?",
      answer:
        "La telemedicina te permite tener consultas virtuales con tu médico. Solo necesitas una conexión a internet y un dispositivo con cámara y micrófono.",
      category: "technical",
    },
    {
      id: "5",
      question: "¿Cómo actualizo mi información personal?",
      answer:
        'Puedes actualizar tu información personal desde la sección "Mi Perfil". Haz clic en "Editar" y guarda los cambios.',
      category: "general",
    },
    {
      id: "6",
      question: "¿Qué hago si olvidé mi contraseña?",
      answer:
        'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones para restablecerla.',
      category: "technical",
    },
  ];

  const tickets: SupportTicket[] = [
    {
      id: "1",
      subject: "Problema para acceder a resultados de laboratorio",
      description:
        "No puedo ver mis resultados de laboratorio del último análisis de sangre.",
      status: "open",
      priority: "medium",
      createdAt: "2025-01-25T10:30:00Z",
      updatedAt: "2025-01-25T10:30:00Z",
    },
    {
      id: "2",
      subject: "Error en la aplicación móvil",
      description:
        "La aplicación se cierra inesperadamente cuando intento ver mi historial médico.",
      status: "in_progress",
      priority: "high",
      createdAt: "2025-01-24T15:45:00Z",
      updatedAt: "2025-01-26T09:15:00Z",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-blue-600 bg-blue-100";
      case "in_progress":
        return "text-yellow-600 bg-yellow-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      case "closed":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Abierto";
      case "in_progress":
        return "En Progreso";
      case "resolved":
        return "Resuelto";
      case "closed":
        return "Cerrado";
      default:
        return "Desconocido";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return "Desconocida";
    }
  };

  const filteredFAQs =
    selectedCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Centro de Soporte
        </h1>
        <p className="text-gray-600">
          Encuentra ayuda y respuestas a tus preguntas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-6 py-3 font-medium ${
            activeTab === "faq"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Preguntas Frecuentes
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={`px-6 py-3 font-medium ${
            activeTab === "contact"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Contacto
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-6 py-3 font-medium ${
            activeTab === "tickets"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Mis Tickets
        </button>
      </div>

      {/* FAQ Tab */}
      {activeTab === "faq" && (
        <div>
          {/* Filtros */}
          <div className="mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              <option value="general">General</option>
              <option value="technical">Técnico</option>
              <option value="medical">Médico</option>
              <option value="billing">Facturación</option>
            </select>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-md">
                <button
                  onClick={() =>
                    setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                  }
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">
                    {faq.question}
                  </span>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información de Contacto */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Contacto
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Teléfono</p>
                  <p className="text-gray-600">+52 55 1234 5678</p>
                  <p className="text-sm text-gray-500">
                    Lun-Vie 8:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">soporte@altamedica.com</p>
                  <p className="text-sm text-gray-500">Respuesta en 24 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Chat en Vivo</p>
                  <p className="text-gray-600">Disponible 24/7</p>
                  <p className="text-sm text-gray-500">
                    Para consultas urgentes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de Contacto */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enviar Mensaje
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Selecciona un asunto</option>
                  <option>Problema técnico</option>
                  <option>Consulta médica</option>
                  <option>Facturación</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe tu consulta o problema..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Mis Tickets de Soporte
            </h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Nuevo Ticket
            </button>
          </div>

          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {ticket.subject}
                    </h4>
                    <p className="text-gray-600 mt-1">{ticket.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                    >
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Creado:{" "}
                    {new Date(ticket.createdAt).toLocaleDateString("es-ES")}
                  </span>
                  <span>
                    Actualizado:{" "}
                    {new Date(ticket.updatedAt).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información Adicional */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <div className="text-center">
          <HelpCircle className="w-12 h-12 mx-auto text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¿No encuentras lo que buscas?
          </h3>
          <p className="text-gray-600 mb-4">
            Nuestro equipo de soporte está disponible para ayudarte con
            cualquier consulta.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Contactar Soporte
            </button>
            <button className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
              Ver Documentación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
