# 🧪 Setup de Usuario de Testing

## Usuario de Testing Requerido en Firebase

Para que el login funcione, necesitas crear este usuario en Firebase Auth:

### 📧 Credenciales de Testing:
- **Email**: `paciente.test@altamedica.com`
- **Password**: `Test123!`
- **Role**: `patient`

### 🔧 Cómo crear el usuario:

#### Opción 1: Firebase Console (Recomendado)
1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar proyecto `altamedic-20f69`
3. Ir a **Authentication** → **Users**
4. Click **Add user**
5. Agregar:
   - Email: `paciente.test@altamedica.com`
   - Password: `Test123!`

#### Opción 2: Via Firebase Admin SDK
```javascript
// Si tienes acceso al admin SDK
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const auth = getAuth();
const db = getFirestore();

// Crear usuario en Auth
const userRecord = await auth.createUser({
  email: 'paciente.test@altamedica.com',
  password: 'Test123!',
  displayName: 'Paciente Test'
});

// Crear documento en Firestore
await db.collection('users').doc(userRecord.uid).set({
  email: 'paciente.test@altamedica.com',
  firstName: 'Paciente',
  lastName: 'Test',
  role: 'patient',
  patientId: 'patient_test_001',
  permissions: ['read_own_data', 'book_appointments'],
  isActive: true,
  createdAt: new Date(),
  lastLogin: new Date()
});
```

### 🏥 Documento Firestore Requerido:

En la colección `users` crear un documento con ID = `uid del usuario`:

```json
{
  "email": "paciente.test@altamedica.com",
  "firstName": "Paciente",
  "lastName": "Test", 
  "role": "patient",
  "patientId": "patient_test_001",
  "permissions": [
    "read_own_data",
    "book_appointments", 
    "view_medical_history",
    "use_telemedicine"
  ],
  "isActive": true,
  "createdAt": "2025-01-08T00:00:00.000Z",
  "lastLogin": "2025-01-08T00:00:00.000Z",
  "phone": "+5491123456789",
  "photoURL": null
}
```

### ✅ Testing el Login:

1. Ir a: `http://localhost:3003/dev-login`
2. Usar credenciales:
   - Email: `paciente.test@altamedica.com`
   - Password: `Test123!`
3. Debe redirigir a: `http://localhost:3003/` (dashboard)

### 🚨 Troubleshooting:

**Si el login falla:**
- Verificar que el usuario existe en Firebase Auth
- Verificar que el documento existe en Firestore `users` collection
- Verificar que `role: "patient"` o `role: "paciente"`
- Verificar que `isActive: true`

**Si aparece "Access denied":**
- El usuario no tiene `role: "patient"`
- El documento no existe en Firestore
- El campo `isActive` es `false`

**Si hay loop infinito:**
- Verificar que `.env.local` tiene `NEXT_PUBLIC_ENVIRONMENT=development`
- Verificar que AuthGuard está usando la ruta `/dev-login`