import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { AlertCircle, CheckCircle, FileText, Globe, Scale, Users } from 'lucide-react';

const TermsPage = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-purple-100 rounded-full px-4 py-2 mb-4">
              <FileText className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-purple-700 font-semibold">Términos y Condiciones</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Términos de Servicio de AltaMedica
            </h1>
            <p className="text-xl text-gray-600">
              Vigente desde:{' '}
              {new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Información importante sobre servicios médicos
                </h3>
                <p className="text-blue-800">
                  AltaMedica facilita la conexión entre pacientes y profesionales médicos
                  certificados. No proporcionamos servicios médicos de emergencia. En caso de
                  emergencia médica, llama inmediatamente al 911 o acude al servicio de urgencias
                  más cercano.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Scale className="h-6 w-6 text-purple-600" />
                1. Aceptación de los términos
              </h2>
              <p className="text-gray-600 mb-4">
                Al acceder o usar AltaMedica, aceptas estos términos de servicio y nuestra política
                de privacidad. Si no estás de acuerdo con alguna parte de estos términos, no debes
                usar nuestros servicios.
              </p>
              <p className="text-gray-600 mb-4">
                Estos términos constituyen un acuerdo legal vinculante entre tú ("Usuario",
                "Paciente", "Médico", o "Empresa") y AltaMedica S.A. de C.V. ("AltaMedica",
                "nosotros", "nuestro").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                2. Descripción del servicio
              </h2>
              <p className="text-gray-600 mb-4">
                AltaMedica es una plataforma de telemedicina que ofrece:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Consultas médicas por video con profesionales certificados</li>
                <li>Gestión de historiales médicos digitales</li>
                <li>Prescripciones electrónicas</li>
                <li>Recordatorios de medicamentos y citas</li>
                <li>Análisis de salud asistidos por inteligencia artificial</li>
                <li>Red de médicos y centros de salud geolocalizados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registro y cuentas</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Elegibilidad</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Debes tener al menos 18 años o contar con consentimiento parental</li>
                <li>
                  Los médicos deben proporcionar credenciales válidas y licencia médica vigente
                </li>
                <li>Las empresas deben estar legalmente constituidas</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                3.2 Información de la cuenta
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Debes proporcionar información precisa y completa</li>
                <li>Eres responsable de mantener la confidencialidad de tu contraseña</li>
                <li>Debes notificarnos inmediatamente sobre cualquier uso no autorizado</li>
                <li>Eres responsable de todas las actividades bajo tu cuenta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Servicios médicos</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.1 Naturaleza de los servicios
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Los servicios no sustituyen la atención médica de emergencia</li>
                <li>Los médicos son profesionales independientes, no empleados de AltaMedica</li>
                <li>Las consultas están sujetas a las limitaciones de la telemedicina</li>
                <li>Algunos diagnósticos requieren examen físico presencial</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                4.2 Relación médico-paciente
              </h3>
              <p className="text-gray-600 mb-4">
                La relación médico-paciente existe únicamente entre el paciente y el médico
                tratante. AltaMedica no practica medicina ni interfiere en el juicio médico
                profesional.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Pagos y facturación</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Tarifas</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Las tarifas se muestran claramente antes de cada servicio</li>
                <li>Los pagos son procesados de forma segura por MercadoPago</li>
                <li>Las suscripciones se renuevan automáticamente</li>
                <li>Puedes cancelar tu suscripción en cualquier momento</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Reembolsos</h3>
              <p className="text-gray-600 mb-4">
                Ofrecemos garantía de satisfacción de 30 días para nuevos usuarios. Los reembolsos
                por consultas específicas se evalúan caso por caso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Uso aceptable</h2>
              <p className="text-gray-600 mb-4">Te comprometes a NO:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Usar el servicio para emergencias médicas</li>
                <li>Proporcionar información médica falsa</li>
                <li>Compartir tu cuenta con terceros</li>
                <li>Intentar obtener medicamentos controlados de forma inapropiada</li>
                <li>Acosar o abusar de médicos u otros usuarios</li>
                <li>Usar el servicio para actividades ilegales</li>
                <li>Intentar hackear o dañar nuestros sistemas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propiedad intelectual</h2>
              <p className="text-gray-600 mb-4">
                Todo el contenido de AltaMedica, incluyendo software, diseños, logos y tecnología,
                es propiedad de AltaMedica o sus licenciantes. No puedes copiar, modificar o
                distribuir nuestro contenido sin autorización expresa.
              </p>
              <p className="text-gray-600 mb-4">
                Tu historial médico y datos personales siempre serán de tu propiedad. Nos otorgas
                licencia limitada para usar esta información únicamente para proporcionarte
                servicios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Limitación de responsabilidad
              </h2>
              <p className="text-gray-600 mb-4">EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>AltaMedica no garantiza resultados médicos específicos</li>
                <li>No somos responsables por diagnósticos o tratamientos médicos</li>
                <li>
                  Nuestra responsabilidad máxima se limita a las tarifas pagadas en los últimos 12
                  meses
                </li>
                <li>No somos responsables por daños indirectos o consecuenciales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnización</h2>
              <p className="text-gray-600 mb-4">
                Aceptas indemnizar y mantener indemne a AltaMedica de cualquier reclamo derivado de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Tu uso de los servicios</li>
                <li>Violación de estos términos</li>
                <li>Violación de derechos de terceros</li>
                <li>Información incorrecta proporcionada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="h-6 w-6 text-purple-600" />
                10. Ley aplicable y jurisdicción
              </h2>
              <p className="text-gray-600 mb-4">
                Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en
                los tribunales competentes de la Ciudad de México, renunciando a cualquier otro
                fuero.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modificaciones</h2>
              <p className="text-gray-600 mb-4">
                Podemos actualizar estos términos ocasionalmente. Te notificaremos sobre cambios
                materiales con al menos 30 días de anticipación. El uso continuado después de las
                modificaciones constituye aceptación de los nuevos términos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Terminación</h2>
              <p className="text-gray-600 mb-4">
                Puedes terminar tu cuenta en cualquier momento. Nosotros podemos suspender o
                terminar tu acceso si violas estos términos. La terminación no afecta obligaciones
                previas.
              </p>
            </section>
          </div>

          {/* Contact */}
          <div className="bg-purple-50 rounded-lg p-8 mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Preguntas sobre nuestros términos?
            </h2>
            <p className="text-gray-600 mb-6">
              Estamos aquí para aclarar cualquier duda sobre nuestros términos de servicio.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Departamento Legal</h3>
                <a
                  href="mailto:legal@altamedica.com"
                  className="text-purple-600 hover:text-purple-700"
                >
                  legal@altamedica.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Soporte General</h3>
                <a
                  href="mailto:support@altamedica.com"
                  className="text-purple-600 hover:text-purple-700"
                >
                  support@altamedica.com
                </a>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  Estos términos han sido revisados por abogados especializados en salud digital
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsPage;
