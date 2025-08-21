import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AlertCircle, Database, Eye, Lock, Shield, UserCheck } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-blue-100 rounded-full px-4 py-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-700 font-semibold">Política de Privacidad</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Tu privacidad es nuestra prioridad
            </h1>
            <p className="text-xl text-gray-600">
              Última actualización:{' '}
              {new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* HIPAA Badge */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Cumplimiento HIPAA Certificado
                </h3>
                <p className="text-green-800">
                  AltaMedica cumple con todos los estándares de la Ley de Portabilidad y
                  Responsabilidad del Seguro Médico (HIPAA) para proteger tu información médica
                  personal. Nuestros sistemas están auditados y certificados por organismos
                  independientes.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-600" />
                1. Información que recopilamos
              </h2>
              <p className="text-gray-600 mb-4">
                En AltaMedica, recopilamos únicamente la información necesaria para brindarte
                servicios médicos de calidad:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Información personal:</strong> Nombre, fecha de nacimiento, género,
                  dirección, teléfono y correo electrónico.
                </li>
                <li>
                  <strong>Información médica:</strong> Historial médico, síntomas, diagnósticos,
                  tratamientos, medicamentos y alergias.
                </li>
                <li>
                  <strong>Información de pago:</strong> Datos de tarjetas (procesados de forma
                  segura por MercadoPago).
                </li>
                <li>
                  <strong>Datos de uso:</strong> Cómo interactúas con nuestra plataforma para
                  mejorar tu experiencia.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-blue-600" />
                2. Cómo protegemos tu información
              </h2>
              <p className="text-gray-600 mb-4">
                Implementamos múltiples capas de seguridad para proteger tu información:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Encriptación de grado militar:</strong> Todos los datos se encriptan con
                  AES-256 en reposo y TLS 1.3 en tránsito.
                </li>
                <li>
                  <strong>Acceso restringido:</strong> Solo personal médico autorizado puede acceder
                  a tu información médica.
                </li>
                <li>
                  <strong>Auditorías regulares:</strong> Realizamos auditorías de seguridad
                  trimestrales con empresas especializadas.
                </li>
                <li>
                  <strong>Backups seguros:</strong> Copias de seguridad encriptadas en múltiples
                  ubicaciones geográficas.
                </li>
                <li>
                  <strong>Autenticación de dos factores:</strong> Protección adicional para todas
                  las cuentas médicas.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" />
                3. Cómo usamos tu información
              </h2>
              <p className="text-gray-600 mb-4">Tu información se utiliza exclusivamente para:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Proporcionar servicios médicos y telemedicina</li>
                <li>Coordinar citas y recordatorios médicos</li>
                <li>Procesar pagos de forma segura</li>
                <li>Mejorar la calidad de nuestros servicios médicos</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Investigación médica (solo con datos anonimizados y tu consentimiento)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-blue-600" />
                4. Tus derechos
              </h2>
              <p className="text-gray-600 mb-4">Tienes control total sobre tu información:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Acceso:</strong> Puedes solicitar una copia completa de tu información en
                  cualquier momento.
                </li>
                <li>
                  <strong>Corrección:</strong> Puedes actualizar o corregir cualquier información
                  incorrecta.
                </li>
                <li>
                  <strong>Eliminación:</strong> Puedes solicitar la eliminación de tu cuenta y datos
                  (excepto los requeridos por ley).
                </li>
                <li>
                  <strong>Portabilidad:</strong> Puedes exportar tu historial médico en formato
                  estándar.
                </li>
                <li>
                  <strong>Restricción:</strong> Puedes limitar cómo usamos cierta información.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Compartir información</h2>
              <p className="text-gray-600 mb-4">
                <strong>NUNCA</strong> vendemos tu información. Solo la compartimos en estos casos
                limitados:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Con profesionales médicos que te atienden (con tu consentimiento)</li>
                <li>Con laboratorios y farmacias para cumplir con tus tratamientos</li>
                <li>Cuando la ley lo requiera (órdenes judiciales válidas)</li>
                <li>En emergencias médicas para salvaguardar tu vida</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Retención de datos</h2>
              <p className="text-gray-600 mb-4">
                Mantenemos tu información médica de forma segura durante toda tu vida, como lo
                requieren las regulaciones médicas. Otros datos se retienen según sea necesario para
                cumplir con obligaciones legales y resolver disputas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Menores de edad</h2>
              <p className="text-gray-600 mb-4">
                Los menores de 18 años requieren consentimiento parental para usar nuestros
                servicios. Los padres/tutores tienen acceso completo a la información médica de sus
                hijos menores.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cambios a esta política</h2>
              <p className="text-gray-600 mb-4">
                Te notificaremos por email y dentro de la plataforma sobre cualquier cambio material
                a esta política con al menos 30 días de anticipación.
              </p>
            </section>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 rounded-lg p-8 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Tienes preguntas sobre privacidad?
            </h2>
            <p className="text-gray-600 mb-6">
              Nuestro equipo de privacidad está aquí para ayudarte. No dudes en contactarnos para
              cualquier inquietud sobre cómo protegemos tu información.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Email de privacidad</h3>
                <a
                  href="mailto:privacy@altamedica.com"
                  className="text-blue-600 hover:text-blue-700"
                >
                  privacy@altamedica.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Oficial de Privacidad</h3>
                <p className="text-gray-600">
                  Dr. Roberto Sánchez
                  <br />
                  Chief Privacy Officer
                </p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 py-8 border-t">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="h-5 w-5 text-green-600" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Lock className="h-5 w-5 text-blue-600" />
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPage;
