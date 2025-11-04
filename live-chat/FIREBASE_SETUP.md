# 🔥 Configuración de Firebase para Chat en Vivo

## Problema Actual
Tu autenticación de Firebase funciona correctamente, pero **Firestore Database** no tiene permisos configurados. Esto impide que los usuarios puedan ver o enviar mensajes en el chat.

## ✅ Solución: Configurar Reglas de Firestore

### Paso 1: Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Inicia sesión con tu cuenta de Google
3. Selecciona el proyecto: **ligamx-daf3d**

### Paso 2: Configurar Firestore Database

1. En el menú lateral, busca **"Firestore Database"**
2. Si aún no has creado la base de datos:
   - Click en **"Crear base de datos"**
   - Selecciona **"Iniciar en modo de producción"**
   - Elige la ubicación más cercana (ejemplo: `us-central1`)
   - Click **"Habilitar"**

### Paso 3: Configurar Reglas de Seguridad

1. Una vez creada la base de datos, ve a la pestaña **"Reglas"** (Rules)
2. **Elimina** todo el contenido actual
3. **Copia y pega** estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Mensajes del chat en vivo
    match /liveChat/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      
      // Reacciones a mensajes
      match /reactions/{reactionId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Estado de "escribiendo..."
    match /typing/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Presencia de usuarios online
    match /presence/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click en **"Publicar"** (Publish)
5. Confirma los cambios

### Paso 4: Verificar

1. Recarga la página del chat: `/live-chat`
2. Inicia sesión con Google
3. Ahora deberías poder ver y enviar mensajes

## 📝 Explicación de las Reglas

- `allow read: if request.auth != null` - Solo usuarios autenticados pueden **leer** mensajes
- `allow create: if request.auth != null` - Solo usuarios autenticados pueden **crear** mensajes
- `allow read, write: if request.auth != null` - Control total para usuarios autenticados en reacciones, typing y presencia

## 🔒 Seguridad

Estas reglas son seguras porque:
- ✅ Solo usuarios autenticados con Google pueden acceder
- ✅ No permiten eliminar mensajes de otros usuarios
- ✅ Protegen contra acceso anónimo

## ❓ Problemas Comunes

### "Permission denied" después de configurar
- Espera 1-2 minutos para que las reglas se propaguen
- Recarga la página con Ctrl+Shift+R (limpia caché)
- Verifica que copiaste las reglas **exactamente** como se muestran

### El botón "Iniciar Sesión" aparece aunque ya inicié sesión
- Esto significa que las reglas de Firestore aún no están configuradas
- Sigue los pasos anteriores

### "Firestore Database" no aparece en el menú
- Tu proyecto Firebase podría no tener Firestore habilitado
- Ve a "Compilación" → "Firestore Database" → "Crear base de datos"

## 🆘 Soporte

Si tienes problemas:
1. Verifica que estás en el proyecto correcto (`ligamx-daf3d`)
2. Revisa la consola del navegador (F12) para errores detallados
3. Asegúrate de haber publicado las reglas en Firebase Console
