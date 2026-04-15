# Reglas de Seguridad de Firestore para ULTRAGOL

## Instrucciones

Para que el sistema de códigos promocionales funcione de manera segura, debes configurar las siguientes reglas en Firebase Console:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `ligamx-daf3d`
3. Ve a **Firestore Database** > **Rules**
4. Copia y pega las siguientes reglas:

## Reglas Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios - cada usuario puede leer/escribir su propio documento
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Solo permitir actualizar campos de promo específicos
      allow update: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['promoExpiresAt', 'promoRedeemedAt', 'lastPromoCode', 'promoDurationDays']);
    }
    
    // Códigos promocionales - solo lectura para usuarios autenticados
    // Solo admins pueden escribir (verificado por rol en users collection)
    match /promoCodes/{codeId} {
      allow read: if request.auth != null;
      
      // Solo permitir incrementar currentUses si el usuario está autenticado
      // y el código está activo y no ha alcanzado el límite
      allow update: if request.auth != null &&
                      resource.data.isActive == true &&
                      (resource.data.maxUses == 0 || resource.data.currentUses < resource.data.maxUses) &&
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['currentUses', 'lastUsedAt']) &&
                      request.resource.data.currentUses == resource.data.currentUses + 1;
      
      // Solo admins pueden crear/eliminar códigos
      allow create, delete: if request.auth != null && 
                             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Solo admins pueden hacer actualizaciones completas (activar/desactivar)
      allow update: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Configurar tu cuenta como Admin

Para poder acceder a la página de administración de códigos:

1. Ve a Firebase Console > Firestore Database
2. Busca la colección `users`
3. Encuentra tu documento de usuario (por tu UID o email)
4. Agrega o modifica el campo `role` con el valor `"admin"`

## Estructura de Datos

### Colección: `promoCodes`
```json
{
  "code": "ULTRA2024",
  "createdAt": Timestamp,
  "expiresAt": Timestamp,
  "maxUses": 10,
  "currentUses": 3,
  "durationDays": 14,
  "isActive": true,
  "createdBy": "admin@email.com"
}
```

### Colección: `users` (campos de promo)
```json
{
  "promoExpiresAt": Timestamp,
  "promoRedeemedAt": Timestamp,
  "lastPromoCode": "ULTRA2024",
  "promoDurationDays": 14
}
```

## Notas de Seguridad

- Los usuarios solo pueden canjear códigos si están autenticados
- Los códigos solo pueden ser creados/modificados/eliminados por administradores
- El incremento del contador de usos está protegido para evitar manipulación
- El estado de promoción se guarda en el perfil del usuario para persistencia entre dispositivos
