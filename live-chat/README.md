# 🔥 UltraGol Live Chat

Chat en vivo profesional para streaming deportivo con Firebase en tiempo real.

## ✨ Características

### 🎨 Diseño Profesional
- **Tema oscuro moderno** inspirado en plataformas de streaming
- **Animaciones suaves** y transiciones profesionales
- **UI responsive** que funciona en desktop y móvil
- **Gradientes personalizados** con colores de marca UltraGol

### 💬 Sistema de Chat
- **Mensajes en tiempo real** con Firebase Firestore
- **Autenticación con Google** usando Firebase Auth
- **Avatares de usuario** y nombres personalizados
- **Badges y verificaciones** (VIP, Verificado, Moderador)
- **Timestamps** en cada mensaje

### 😊 Emojis y Formato
- **Picker de emojis** con 30+ emojis deportivos
- **Inserción rápida** de emojis en mensajes
- **Contador de caracteres** (máx. 200)
- **Formato HTML seguro** para prevenir XSS

### 📊 Estadísticas en Vivo
- **Contador de espectadores** en tiempo real
- **Mensajes totales** enviados
- **Usuarios activos** conectados
- **Indicador LIVE** con animación pulsante

### 🔒 Seguridad
- **Escape HTML** en todos los mensajes
- **Validación de entrada** en el cliente
- **Reglas de seguridad** de Firebase (configurar en Firebase Console)
- **Autenticación requerida** para enviar mensajes

## 🚀 Cómo Usar

### 1. Abrir la Página
Navega a: `live-chat/index.html`

### 2. Iniciar Sesión
- Haz clic en "Iniciar Sesión" en la esquina superior derecha
- Inicia sesión con tu cuenta de Google
- Tu avatar y nombre aparecerán automáticamente

### 3. Enviar Mensajes
- Escribe tu mensaje en el campo de texto
- Usa el botón de emoji 😊 para agregar emojis
- Presiona Enter o el botón ➤ para enviar

### 4. Ver Mensajes en Tiempo Real
- Los mensajes aparecen instantáneamente
- Desplázate hacia arriba para ver mensajes antiguos
- Los mensajes se actualizan automáticamente

## 🔧 Configuración de Firebase

### Reglas de Firestore Recomendadas

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /liveChat/{messageId} {
      allow read: if true;
      allow create: if request.auth != null 
        && request.resource.data.text.size() <= 200
        && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
    
    match /presence/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

### Dominios Autorizados
En Firebase Console → Authentication → Settings → Authorized domains:
- Agrega tu dominio de Replit
- Agrega `localhost` para desarrollo local

## 🎯 Estructura de Archivos

\`\`\`
live-chat/
├── index.html       # Página principal del chat
├── style.css        # Estilos profesionales
├── chat.js          # Lógica del chat con Firebase
└── README.md        # Esta documentación
\`\`\`

## 🎨 Personalización

### Colores (en style.css)
\`\`\`css
--primary-color: #53fc18;    /* Verde neón */
--secondary-color: #00e5ff;  /* Cyan */
--bg-dark: #0e0e10;          /* Fondo oscuro */
--accent-red: #ff4655;       /* Rojo para LIVE */
\`\`\`

### Emojis (en chat.js)
Edita el array `emojis` para cambiar o agregar emojis.

## 🐛 Solución de Problemas

### Firebase no se conecta
1. Verifica que `firebase-config.js` esté cargado correctamente
2. Revisa la consola del navegador para errores
3. Asegúrate de que el dominio esté autorizado en Firebase Console

### Los mensajes no aparecen
1. Verifica las reglas de Firestore
2. Comprueba que el usuario esté autenticado
3. Revisa la consola para errores de permisos

### El emoji picker no funciona
1. Asegúrate de estar autenticado
2. Verifica que JavaScript esté habilitado
3. Revisa la consola del navegador

## 📱 Compatibilidad

- ✅ Chrome/Edge (Recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Dispositivos móviles iOS/Android

## 🔮 Futuras Mejoras

- [ ] Sistema de moderadores
- [ ] Mensajes destacados
- [ ] Reacciones a mensajes
- [ ] Chat rooms separados
- [ ] Modo teatro completo
- [ ] Notificaciones de escritorio
- [ ] Comandos de chat (ej: /clear)
- [ ] Filtros de lenguaje
- [ ] Modo solo seguidores

---

Creado con ❤️ para UltraGol by L3HO
