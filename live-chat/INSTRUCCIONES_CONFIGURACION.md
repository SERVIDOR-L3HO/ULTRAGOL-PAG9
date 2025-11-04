# 🔧 Cómo Configurar el Chat en Vivo

## ⚠️ PROBLEMA ACTUAL

Si ves el error **"No se pudo enviar el mensaje"**, significa que las reglas de seguridad de Firestore no están configuradas.

## ✅ SOLUCIÓN RÁPIDA (5 minutos)

### Paso 1: Ir a Firebase Console
1. Abre tu navegador y ve a: https://console.firebase.google.com
2. Inicia sesión con tu cuenta de Google
3. Selecciona tu proyecto: **ligamx-daf3d**

### Paso 2: Abrir Firestore Database
1. En el menú lateral izquierdo, busca **"Firestore Database"**
2. Si no tienes Firestore creado:
   - Haz clic en **"Crear base de datos"**
   - Selecciona **"Iniciar en modo de producción"**
   - Elige la ubicación: **us-central1** (o la más cercana)
   - Haz clic en **"Habilitar"**

### Paso 3: Configurar las Reglas de Seguridad

1. Una vez en Firestore Database, haz clic en la pestaña **"Reglas"** (Rules)
2. Verás un editor de texto con las reglas actuales
3. **ELIMINA TODO** el contenido
4. **COPIA Y PEGA** estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para mensajes del chat en vivo
    match /liveChatMessages/{messageId} {
      // Todos pueden leer mensajes (chat público)
      allow read: if true;
      
      // Solo usuarios autenticados pueden crear mensajes
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      // Solo el dueño puede editar/eliminar su mensaje
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.userId;
    }
    
    // Datos de usuarios
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Haz clic en el botón **"Publicar"** (Publish) arriba
6. Confirma la publicación

### Paso 4: Verificar que Funciona

1. Espera **10-20 segundos** (las reglas tardan en aplicarse)
2. Recarga tu página del chat
3. Intenta enviar un mensaje
4. ¡Debería funcionar! ✅

---

## 🎯 ¿Qué Hacen Estas Reglas?

- **✅ Leer mensajes**: Todos pueden ver los mensajes (chat público)
- **✅ Crear mensajes**: Solo usuarios autenticados (que iniciaron sesión)
- **✅ Editar mensajes**: Solo el autor de cada mensaje
- **✅ Eliminar mensajes**: Solo el autor de cada mensaje
- **✅ Reaccionar**: Todos los usuarios autenticados pueden agregar reacciones

---

## ❓ Problemas Comunes

### Error: "permission-denied" después de configurar
- **Solución**: Espera 30 segundos y recarga la página con Ctrl+Shift+R

### No puedo ver la pestaña "Firestore Database"
- **Solución**: 
  1. Ve a "Compilación" en el menú lateral
  2. Busca "Firestore Database"
  3. Haz clic en "Crear base de datos"

### El chat dice "Chat no disponible"
- **Solución**: Firebase no está inicializado correctamente. Verifica que el archivo `firebase-config.js` esté cargado correctamente.

### Olvidé cuál es mi proyecto de Firebase
- **Solución**: El proyecto se llama **ligamx-daf3d** (puedes verlo en el código)

---

## 📱 Funcionalidades del Chat

Una vez configurado, tu chat tendrá:

- ✅ Enviar mensajes de texto
- ✅ Enviar imágenes
- ✅ Editar tus mensajes
- ✅ Eliminar tus mensajes
- ✅ Responder a mensajes
- ✅ Reaccionar con emojis
- ✅ Ver mensajes en tiempo real
- ✅ Modo anónimo
- ✅ Buscar en el chat
- ✅ Autenticación con Google

---

## 🔒 Seguridad

Las reglas configuradas son **seguras** porque:
- Solo usuarios autenticados pueden escribir
- Nadie puede editar o borrar mensajes de otros
- Los datos de usuario están protegidos

---

## 💡 ¿Necesitas Ayuda?

Si sigues teniendo problemas:
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes en rojo que digan el error exacto
4. El error te dirá qué falta configurar

---

**¡Listo! Con esto tu chat debería funcionar perfectamente 🎉**
