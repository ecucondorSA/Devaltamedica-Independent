import { redirect } from 'next/navigation';

export default function CompaniesMainPage() {
  // Redirigir la home directamente al Operation Hub
  redirect('/operations-hub');
}