# ⚠️ ARCHIVO DESACTUALIZADO

## 📌 IMPORTANTE: USA EL NUEVO ARCHIVO

Este archivo contiene reglas antiguas que **bloquean** editar y eliminar mensajes.

**👉 Por favor usa el archivo `INSTRUCCIONES_CONFIGURACION.md` en su lugar.**

---

# Configuración de Reglas de Firebase para Chat Público (DESACTUALIZADO)

## ⚠️ IMPORTANTE: Configurar Reglas de Firestore

Para que el chat funcione correctamente, necesitas configurar las reglas de seguridad en Firebase Firestore.

### Pasos para configurar:

1. **Ir a la Consola de Firebase**
   - Visita: https://console.firebase.google.com/
   - Selecciona tu proyecto: `ligamx-daf3d`

2. **Abrir Firestore Database**
   - En el menú lateral, haz clic en "Firestore Database"
   - Ve a la pestaña "Reglas" (Rules)

3. **Copiar y pegar estas reglas**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para el chat público
    match /liveChatMessages/{messageId} {
      // TODOS pueden leer mensajes (público)
      allow read: if true;
      
      // CUALQUIERA puede escribir mensajes (chat público)
      // Validación: debe tener username, texto o imagen, y timestamp válido
      allow create: if request.resource.data.username is string &&
                       request.resource.data.username.size() > 0 &&
                       request.resource.data.username.size() <= 50 &&
                       (request.resource.data.text is string || 
                        request.resource.data.image is string) &&
                       request.resource.data.keys().hasAll(['username', 'timestamp']) &&
                       request.time != null;
      
      // Nadie puede actualizar o eliminar mensajes
      allow update, delete: if false;
    }
    
    // Mantén tus otras reglas existentes aquí...
  }
}
```

4. **Publicar las reglas**
   - Haz clic en "Publicar" (Publish)
   - Espera unos segundos a que se apliquen

### Explicación de las reglas:

- **`allow read: if true;`** → Todos pueden VER mensajes (incluso sin cuenta)
- **`allow create: if ...`** → Cualquiera puede ENVIAR mensajes si tiene los campos requeridos
- **`allow update, delete: if false;`** → Nadie puede editar o borrar mensajes

### Alternativa: Reglas MÁS Permisivas (Solo para desarrollo)

Si solo quieres probar rápidamente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /liveChatMessages/{messageId} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ADVERTENCIA**: Estas reglas permiten que cualquiera haga cualquier cosa. Úsalas solo para pruebas.

---

## Verificar que funciona

Después de configurar las reglas:
1. Recarga la página del chat
2. Ingresa un nombre (toca el ícono de usuario)
3. Envía un mensaje de prueba
4. Abre el chat en otra ventana → deberías ver el mismo mensaje

## ¿Problemas?

Si ves el error "Missing or insufficient permissions":
- Verifica que publicaste las reglas en Firebase
- Espera 10-30 segundos a que se apliquen
- Recarga la página del chat

## Características del Chat Público

✅ **Todos ven los mismos mensajes** en tiempo real
✅ **Sin sesión**: Puedes ver mensajes sin cuenta
✅ **Con nombre**: Necesitas poner un nombre para enviar
✅ **Persistente**: Los mensajes se guardan en la nube
✅ **Tiempo real**: Los mensajes aparecen al instante para todos
