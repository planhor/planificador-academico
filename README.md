# Planificador Académico

Aplicación web para planificación horaria académica, gestión de carreras, niveles, secciones, asignaturas, docentes, salas, Gestor Secciones, reportes, vista horario, respaldo, sincronización con Firebase y solver local de optimización.

## Estructura

- `docs/index.html`: archivo principal para GitHub Pages y Firebase Hosting.
- `docs/planificador_modulos/`: módulos JavaScript, estilos, íconos y manifest.
- `firebase.json`: configuración de Firebase Hosting.
- `.firebaserc.example`: ejemplo de proyecto Firebase.
- `firestore.rules.example`: ejemplo base de reglas de Firestore.
- `DEPLOYMENT.md`: guía de publicación.

## Publicación Rápida En GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube todo el contenido de esta carpeta.
3. En GitHub, entra a `Settings > Pages`.
4. En `Build and deployment`, elige:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
5. Guarda y espera que GitHub entregue la URL pública.

## Publicación Rápida En Firebase Hosting

1. Instala Firebase CLI si no lo tienes.
2. Copia `.firebaserc.example` como `.firebaserc`.
3. Revisa que el proyecto sea correcto.
4. Ejecuta `firebase deploy --only hosting` desde esta carpeta.

## Importante Sobre Firebase

La configuración Firebase del cliente está dentro de `docs/index.html`. Esa configuración no es una contraseña, pero la seguridad real depende de:

- Reglas de Firestore.
- Usuarios habilitados en Firebase Authentication.
- Dominios autorizados en Authentication.
- Control de quién puede crear cuenta o iniciar sesión.

Antes de publicar, revisa `DEPLOYMENT.md`.

