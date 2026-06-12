# BOX Manager v2.0

Sistema de gestión integral para CrossFit — con base de datos real, autenticación y soporte móvil.

**Desarrollado por Kenny Vianey Vargas Segura**
Administradora de Empresas · Máster en Project Management con Mención en Business Analytics

---

## Stack tecnológico

- **Frontend:** React 18 + Vite
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Hosting:** Vercel (gratis)
- **Móvil:** PWA (instalable) + Expo para app nativa

## Módulos

| Módulo | Rol requerido |
|---|---|
| Dashboard | Todos |
| Control de acceso | Todos |
| Atletas | Todos |
| Mensualidades | Todos |
| Suscripciones y planes | Dueño |
| Rutinas / WOD | Todos |
| Progreso atletas | Todos |
| Tienda | Todos |
| Finanzas BOX | Dueño |
| Métricas | Dueño |
| Configuración BOX | Dueño |
| Políticas y documentos | Dueño |

## Inicio rápido

```bash
# 1. Clonar o descomprimir el proyecto
# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Iniciar en desarrollo
npm run dev

# 5. Construir para producción
npm run build
```

Lee `GUIA_DESPLIEGUE.md` para instrucciones completas paso a paso.

## Licencia

© 2026 Kenny Vianey Vargas Segura — Todos los derechos reservados.
Protección de datos bajo Ley 1581 de 2012 (Colombia).
