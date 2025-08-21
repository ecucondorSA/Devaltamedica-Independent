// 🔐 Página de login local eliminada por política de seguridad.
// Esta página solo actúa como redirección inmediata al login centralizado
// en web-app (/auth/login). Nunca debe existir un formulario de credenciales
// duplicado aquí para evitar bypass o divergencia de flujos SSO.

import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Login Centralizado - Redirección',
  robots: 'noindex'
}

export default function AdminLoginRedirectPage() {
  // Preservar intención de origen
  redirect('http://localhost:3000/auth/login?from=admin')
}