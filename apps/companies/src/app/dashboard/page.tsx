import { redirect } from 'next/navigation';

// Ruta legacy: redirige el dashboard antiguo al Operation Hub
export default function DashboardRedirect() {
  redirect('/operations-hub');
}
