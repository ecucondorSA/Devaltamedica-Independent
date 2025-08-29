// 🧭 Generado automáticamente por RouteNavigator
// No editar manualmente - se regenera automáticamente

export interface RouteInfo {
  path: string;
  title: string;
  app: string;
  requiresAuth: boolean;
  role?: string;
  params?: string[];
}

export interface AppInfo {
  name: string;
  baseUrl: string;
  port: number;
  routes: RouteInfo[];
}

// 📱 Configuración de aplicaciones
export const APPS: Record<string, AppInfo> = {
  "admin": {
    name: "admin",
    baseUrl: "http://localhost:3005",
    port: 3005,
    routes: [
      {
        path: "/",
        title: "Home",
        app: "admin",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
    ]
  },
  "api-server": {
    name: "api-server",
    baseUrl: "http://localhost:3001",
    port: 3001,
    routes: [
      {
        path: "/",
        title: "Home",
        app: "api-server",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/dashboard",
        title: "Dashboard",
        app: "api-server",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/test-alias",
        title: "Test Alias",
        app: "api-server",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/dashboard/api-monitor",
        title: "C:\\ - Users - Eduardo - Documents - Devaltamedica - Apps - Api Server - Src - Pages - Dashboard",
        app: "api-server",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
    ]
  },
  "companies": {
    name: "companies",
    baseUrl: "http://localhost:3004",
    port: 3004,
    routes: [
      {
        path: "/",
        title: "Home",
        app: "companies",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/_temp_pages",
        title: "_Temp_Pages",
        app: "companies",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
    ]
  },
  "doctors": {
    name: "doctors",
    baseUrl: "http://localhost:3002",
    port: 3002,
    routes: [
      {
        path: "/",
        title: "Home",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/citas",
        title: "Citas",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/dashboard",
        title: "Dashboard",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/marketplace",
        title: "Cardiólogo Intervencionista - Urgente",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/onboarding",
        title: "Onboarding",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/pacientes",
        title: "Pacientes",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/profile",
        title: "Información Básica",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine",
        title: "Consulta de seguimiento",
        app: "doctors",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
      {
        path: "/test-video",
        title: "Doctor Video",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine/professional",
        title: "Telemedicine - Professional",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine/test",
        title: "Telemedicine - Test",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine/[sessionId]",
        title: "Telemedicine - Sessionid",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: ["sessionId"]
      },
      {
        path: "/telemedicine/session/[sessionId]",
        title: "Telemedicine - Session - Sessionid",
        app: "doctors",
        requiresAuth: true,
        role: undefined,
        params: ["sessionId"]
      },
      {
        path: "/telemedicine/room/[roomId]",
        title: "Telemedicine - Room - Roomid",
        app: "doctors",
        requiresAuth: true,
        role: undefined,
        params: ["roomId"]
      },
      {
        path: "/profile/edit",
        title: "Profile - Edit",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/marketplace/applications",
        title: "Cardiólogo Intervencionista - Urgente",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/marketplace/listings/[id]",
        title: "Cardiólogo Intervencionista - Urgente",
        app: "doctors",
        requiresAuth: false,
        role: undefined,
        params: ["id"]
      },
    ]
  },
  "patients": {
    name: "patients",
    baseUrl: "http://localhost:3003",
    port: 3003,
    routes: [
      {
        path: "/",
        title: "Tienes actualizaciones importantes",
        app: "patients",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
      {
        path: "/ai-diagnosis",
        title: "Ai Diagnosis",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/appointments",
        title: "Appointments",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/doctors",
        title: "Doctors",
        app: "patients",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
      {
        path: "/galeria-componentes",
        title: "Galeria Componentes",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/health-metrics",
        title: "Health Metrics",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/hospital3d-simulator",
        title: "Hospital3D Simulator",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/lab-results",
        title: "Lab Results",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/medical-history",
        title: "Consulta de Cardiología",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/notifications",
        title: "Recordatorio de cita médica",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/onboarding",
        title: "Onboarding",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/patients",
        title: "Patients",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/post-consultation",
        title: "Resumen de Consulta Médica",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/prescriptions",
        title: "Prescriptions",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/profile",
        title: "Profile",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/settings",
        title: "Settings",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/support",
        title: "Support",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine",
        title: "Consulta en Curso",
        app: "patients",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
      {
        path: "/test-results",
        title: "Test Results",
        app: "patients",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine/test",
        title: "Verificación de Equipos",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine/waiting",
        title: "Telemedicine - Waiting",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/telemedicine/[sessionId]",
        title: "Telemedicine - Sessionid",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: ["sessionId"]
      },
      {
        path: "/telemedicine/webrtc/[roomId]",
        title: "Chat",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: ["roomId"]
      },
      {
        path: "/telemedicine/room/[roomId]",
        title: "Telemedicine - Room - Roomid",
        app: "patients",
        requiresAuth: true,
        role: undefined,
        params: ["roomId"]
      },
      {
        path: "/telemedicine/consultation/[sessionId]",
        title: "Telemedicine - Consultation - Sessionid",
        app: "patients",
        requiresAuth: true,
        role: undefined,
        params: ["sessionId"]
      },
      {
        path: "/prescriptions/[id]",
        title: "Prescriptions - Id",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: ["id"]
      },
      {
        path: "/patients/[id]",
        title: "Patients - Id",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: ["id"]
      },
      {
        path: "/onboarding/company",
        title: "Información de la Empresa",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/onboarding/doctor",
        title: "Información Personal",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/onboarding/select-role",
        title: "Paciente",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/medical-history/[id]",
        title: "Medical History - Id",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: ["id"]
      },
      {
        path: "/lab-results/[id]",
        title: "Lab Results - Id",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: ["id"]
      },
      {
        path: "/auth/register",
        title: "Auth - Register",
        app: "patients",
        requiresAuth: false,
        role: "patient",
        params: undefined
      },
      {
        path: "/appointments/book",
        title: "Seleccionar Especialidad",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/appointments/new",
        title: "Appointments - New",
        app: "patients",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/appointments/[id]",
        title: "Información de la Cita",
        app: "patients",
        requiresAuth: true,
        role: undefined,
        params: ["id"]
      },
    ]
  },
  "web-app": {
    name: "web-app",
    baseUrl: "http://localhost:3000",
    port: 3000,
    routes: [
      {
        path: "/",
        title: "Introducción a AltaMedica",
        app: "web-app",
        requiresAuth: false,
        role: "Cardióloga, Hospital Central",
        params: undefined
      },
      {
        path: "/anamnesis-interactiva",
        title: "Anamnesis Interactiva",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/anamnesis-juego",
        title: "Esto ayuda al doctor a personalizar tu atención basada en evidencia clínica.",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/calculadora-precios",
        title: "Calculadora Precios",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/demo",
        title: "Agenda una consulta",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/help",
        title: "Help",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
  // /home-optimized eliminado (anterior alias de home consolidado)
      {
        path: "/hospital3d",
        title: "Hospital3D",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/landing-demo",
        title: "Consultas Médicas en Video",
        app: "web-app",
        requiresAuth: false,
        role: "Paciente",
        params: undefined
      },
      {
        path: "/privacy",
        title: "Privacy",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/profile",
        title: "Profile",
        app: "web-app",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
      {
        path: "/status",
        title: "Mantenimiento programado de base de datos",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/terms",
        title: "Terms",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/unauthorized",
        title: "Unauthorized",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/(auth)/forgot-password",
        title: "(Auth) - Forgot Password",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/(auth)/login",
        title: "(Auth) - Login",
        app: "web-app",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
      {
        path: "/(auth)/register",
        title: "(Auth) - Register",
        app: "web-app",
        requiresAuth: false,
        role: undefined,
        params: undefined
      },
      {
        path: "/(auth)/verify-email",
        title: "(Auth) - Verify Email",
        app: "web-app",
        requiresAuth: true,
        role: undefined,
        params: undefined
      },
    ]
  },
};

// 🔗 Helper functions
export const getAppUrl = (appName: string, route: string = "/"): string => {
  const app = APPS[appName];
  if (!app) throw new Error(`App ${appName} not found`);
  return `${app.baseUrl}${route}`;
};

export const getAllRoutes = (): RouteInfo[] => {
  return Object.values(APPS).flatMap(app => app.routes);
};

export const getRoutesByApp = (appName: string): RouteInfo[] => {
  return APPS[appName]?.routes || [];
};

export const findRoute = (path: string, appName?: string): RouteInfo | undefined => {
  const routes = appName ? getRoutesByApp(appName) : getAllRoutes();
  return routes.find(route => route.path === path);
};

export const getAuthenticatedRoutes = (): RouteInfo[] => {
  return getAllRoutes().filter(route => route.requiresAuth);
};

export const getRoutesByRole = (role: string): RouteInfo[] => {
  return getAllRoutes().filter(route => route.role === role);
};

// 📊 Estadísticas
export const getRoutesStats = () => {
  const allRoutes = getAllRoutes();
  return {
    totalApps: Object.keys(APPS).length,
    totalRoutes: allRoutes.length,
    authenticatedRoutes: allRoutes.filter(r => r.requiresAuth).length,
    dynamicRoutes: allRoutes.filter(r => r.params && r.params.length > 0).length,
    routesByApp: Object.entries(APPS).map(([name, app]) => ({
      app: name,
      count: app.routes.length
    }))
  };
};
