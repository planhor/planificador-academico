# Guía De Despliegue

Esta carpeta quedó preparada para dos formas de publicación:

- GitHub Pages, usando la carpeta `docs`.
- Firebase Hosting, usando `firebase.json`.

## 1. Revisión Antes De Publicar

Verifica lo siguiente antes de subir:

- La app abre desde `docs/index.html`.
- No existe `planificador_modulos/.Rhistory` dentro de `docs`.
- El título de la app es `Planificador Académico`.
- Firebase apunta al proyecto correcto.
- Firestore tiene reglas seguras.
- Firebase Authentication tiene habilitado el proveedor Email/Password.
- En Authentication, agrega el dominio de GitHub Pages o Firebase Hosting como dominio autorizado.

## 2. GitHub Pages

Sube esta carpeta completa a un repositorio.

En GitHub:

1. Abre el repositorio.
2. Entra a `Settings`.
3. Entra a `Pages`.
4. Selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
5. Guarda.

La app quedará disponible en una URL similar a:

`https://usuario.github.io/nombre-repositorio/`

### Firebase Auth En GitHub Pages

Cuando GitHub entregue la URL:

1. Abre Firebase Console.
2. Entra a Authentication.
3. Entra a Settings.
4. En `Authorized domains`, agrega:
   - `usuario.github.io`

Sin esto, el login puede fallar en GitHub Pages.

## 3. Firebase Hosting

La carpeta ya incluye `firebase.json` apuntando a `docs`.

Pasos:

1. Copia `.firebaserc.example` como `.firebaserc`.
2. Confirma que el project id sea correcto.
3. Ejecuta:

```bash
firebase login
firebase deploy --only hosting
```

Firebase entregará una URL similar a:

`https://planificador-d72c6.web.app`

## 4. Reglas De Firestore

El archivo `firestore.rules.example` es solo una base. Permite leer y escribir a usuarios autenticados.

Para una app privada de coordinación, esto es aceptable como primer cierre si solo tú controlas los usuarios de Firebase Authentication. Para un uso institucional con varios perfiles, conviene después crear reglas por rol.

## 5. Archivos Que No Deben Subirse

No subas:

- Respaldos JSON reales con datos sensibles.
- Planillas institucionales reales.
- Archivos `.Rhistory`.
- Capturas o documentos con información privada.
- `.firebaserc` si prefieres no publicar el id del proyecto, aunque no es una clave secreta.

## 6. Nota Sobre API Key De Firebase

La `apiKey` de Firebase que aparece en el HTML es una configuración pública del cliente. No equivale a una contraseña. La protección debe venir de Authentication, Firestore Rules y dominios autorizados.

