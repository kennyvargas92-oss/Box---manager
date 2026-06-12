# BOX MANAGER — Guía completa de despliegue
**Desarrollado por Kenny Vianey Vargas Segura**
Administradora de Empresas · Máster en Project Management con Mención en Business Analytics

---

## ¿Qué tienes en esta carpeta?

```
boxmanager-v2/
├── supabase_schema.sql      ← Base de datos completa (ejecutar en Supabase)
├── package.json             ← Dependencias del proyecto
├── vite.config.js           ← Configuración del servidor
├── .env.example             ← Plantilla de variables de entorno
├── index.html               ← Punto de entrada web
└── src/
    ├── App.jsx              ← Rutas y autenticación
    ├── main.jsx             ← Entrada React
    ├── index.css            ← Estilos globales
    ├── context/
    │   └── AuthContext.jsx  ← Manejo de sesión y roles
    ├── hooks/
    │   └── useData.js       ← Todas las consultas a Supabase
    ├── lib/
    │   └── supabase.js      ← Cliente de base de datos
    ├── components/
    │   └── Layout.jsx       ← Estructura de la app (sidebar, topbar)
    └── pages/
        ├── LoginPage.jsx    ← Pantalla de inicio de sesión
        ├── Acceso.jsx       ← Control de acceso (completo)
        ├── Dashboard.jsx    ← Panel principal (completo)
        └── [otros módulos] ← Se conectan a Supabase siguiendo el mismo patrón
```

---

## PASO 1 — Crear cuenta en Supabase (gratis)

1. Ve a **https://supabase.com** y crea una cuenta gratuita
2. Haz clic en **"New project"**
3. Elige un nombre (ej: `box-manager`) y una contraseña segura para la base de datos
4. Selecciona la región más cercana a Colombia: **South America (São Paulo)**
5. Espera ~2 minutos mientras se crea el proyecto

---

## PASO 2 — Crear la base de datos

1. En tu proyecto de Supabase, ve a **SQL Editor** (ícono de terminal en el menú izquierdo)
2. Haz clic en **"New query"**
3. Abre el archivo `supabase_schema.sql` de esta carpeta
4. Copia todo el contenido y pégalo en el editor
5. Haz clic en **"Run"** (botón verde)
6. Deberías ver el mensaje: *"Success. No rows returned"*

Esto crea todas las tablas, funciones, seguridad y datos iniciales.

---

## PASO 3 — Crear el primer usuario (dueño del BOX)

1. En Supabase ve a **Authentication** → **Users**
2. Haz clic en **"Add user"** → **"Create new user"**
3. Ingresa el correo del dueño: ej. `admin@mibox.com`
4. Ingresa una contraseña segura
5. Marca **"Auto confirm user"**
6. Haz clic en **"Create user"**

Ahora regístralo como propietario en la tabla del sistema:

1. Ve a **SQL Editor** → **New query**
2. Copia y ejecuta (reemplaza el UUID con el que aparece en Authentication):

```sql
INSERT INTO usuarios_sistema (id, nombre, rol, initiales)
VALUES (
  'PEGA-AQUI-EL-UUID-DEL-USUARIO',
  'Nombre del Dueño',
  'dueño',
  'AD'
);
```

Para crear un colaborador, repite el proceso con `rol = 'colaborador'`.

---

## PASO 4 — Configurar las variables de entorno

1. En Supabase ve a **Settings** → **API**
2. Copia los valores de:
   - **Project URL** (ej: `https://abcdefgh.supabase.co`)
   - **anon / public key** (la clave larga que empieza con `eyJ...`)

3. En tu computador, en la carpeta del proyecto, crea un archivo llamado `.env`:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu_clave_completa_aqui
```

> ⚠️ **Importante:** el archivo `.env` nunca debe subirse a GitHub. Ya está en `.gitignore`.

---

## PASO 5 — Instalar y ejecutar localmente

Necesitas tener **Node.js** instalado (versión 18 o superior).
Descárgalo gratis en: https://nodejs.org

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador en **http://localhost:5173** y verás la pantalla de login.
Ingresa con el correo y contraseña que creaste en Supabase.

---

## PASO 6 — Publicar en internet (Vercel — gratis)

### Opción A: Desde GitHub (recomendado)

1. Crea una cuenta en **https://github.com** si no tienes
2. Crea un repositorio nuevo (privado)
3. Sube el proyecto:
```bash
git init
git add .
git commit -m "BOX Manager v2.0 - Kenny Vargas"
git remote add origin https://github.com/TU-USUARIO/box-manager.git
git push -u origin main
```

4. Ve a **https://vercel.com** y crea una cuenta (puedes entrar con GitHub)
5. Haz clic en **"New Project"** → importa tu repositorio
6. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu clave anon
7. Haz clic en **"Deploy"**

En 2 minutos tendrás tu app en una URL como: `https://box-manager-tuusuario.vercel.app`

### Opción B: Deploy directo sin GitHub

```bash
# Instalar Vercel CLI
npm install -g vercel

# Desde la carpeta del proyecto
vercel

# Sigue las instrucciones en pantalla
# Cuando pida variables de entorno, agrega las dos de Supabase
```

---

## PASO 7 — App móvil (Android, iOS y otros)

### Método 1: PWA (más fácil — sin tiendas de apps)

La app web ya funciona en móvil de forma responsive. Para instalarla como app nativa:

**En Android:**
1. Abre la URL de Vercel en Chrome
2. Toca el menú (3 puntos) → "Agregar a pantalla de inicio"
3. La app aparece como ícono en el escritorio y funciona sin internet

**En iPhone/iPad:**
1. Abre la URL en Safari
2. Toca el ícono de compartir → "Agregar a inicio"

Para activar soporte PWA completo (ícono, splash screen, offline), agrega este archivo:

**public/manifest.json:**
```json
{
  "name": "BOX Manager",
  "short_name": "BOXMgr",
  "description": "Sistema de gestión CrossFit",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111314",
  "theme_color": "#e8430a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Y en `index.html` dentro de `<head>`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="BOX Manager">
```

### Método 2: App nativa con Expo (React Native)

Para publicar en Google Play y App Store necesitas Expo:

```bash
# Instalar Expo CLI
npm install -g @expo/cli

# Crear proyecto móvil
npx create-expo-app box-manager-mobile --template blank

# Instalar Supabase para Expo
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

La lógica de datos (`useData.js`) y el cliente Supabase (`supabase.js`) se reutilizan igual. Solo cambia la interfaz visual de HTML/CSS a componentes React Native.

**Publicar en tiendas:**
- Google Play: necesitas cuenta de desarrollador ($25 único pago)
- App Store: necesitas cuenta Apple Developer ($99/año)
- Alternativa gratuita: publicar en Expo Go para distribución directa

---

## PASO 8 — Dominio personalizado (opcional)

Si el dueño quiere una URL como `sistema.mibox.com`:

1. Compra el dominio en **Namecheap** o **GoDaddy** (~$10/año)
2. En Vercel → tu proyecto → **Settings** → **Domains**
3. Agrega tu dominio y sigue las instrucciones de DNS

---

## Mantenimiento y actualizaciones

**Para hacer cambios en el código:**
1. Edita los archivos localmente
2. `git add . && git commit -m "descripción del cambio"`
3. `git push`
4. Vercel despliega automáticamente en segundos

**Para agregar nuevos módulos:**
Sigue el patrón de `Acceso.jsx`:
1. Importa el hook correspondiente de `useData.js`
2. Usa `supabase.from('tabla').select(...)` para leer datos
3. Usa las funciones de `useData.js` para escribir
4. El sistema de roles ya está integrado — solo agrega la página al array `PERMISOS`

---

## Costos estimados del sistema en producción

| Servicio | Plan | Costo |
|---|---|---|
| Supabase | Free (hasta 500MB y 2GB transferencia) | $0/mes |
| Vercel | Hobby (proyectos ilimitados) | $0/mes |
| Dominio personalizado | Namecheap / GoDaddy | ~$10/año |
| Google Play (una vez) | Developer account | $25 único |
| App Store | Apple Developer | $99/año |
| **Total mínimo operativo** | Web + DB | **$0/mes** |

Cuando el BOX crezca y supere los límites gratuitos:
- Supabase Pro: $25/mes (8GB DB, 250GB transferencia)
- Vercel Pro: $20/mes (builds ilimitados, analytics)

---

## Soporte

Sistema desarrollado por:
**Kenny Vianey Vargas Segura**
Administradora de Empresas
Máster en Project Management con Mención en Business Analytics

© 2026 — Todos los derechos reservados
Protección de datos bajo Ley 1581 de 2012 (Colombia)
