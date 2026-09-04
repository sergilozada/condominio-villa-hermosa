# Condominio Villa Hermosa

Sistema web de gestión inmobiliaria desarrollado para administrar clientes, lotes, pagos, cuotas, reportes y proyecciones de ingresos del proyecto Villa Hermosa.

## Descripción

Control Bienes Raíces es una aplicación web orientada a la administración de proyectos inmobiliarios. Permite registrar clientes, gestionar información de lotes, controlar pagos realizados, identificar cuotas pendientes, clientes atrasados y deudores, además de generar reportes y proyecciones de ingresos.

## Funcionalidades principales

- Registro y búsqueda de clientes
- Gestión de manzanas, lotes y metrajes
- Control de pagos al contado y por cuotas
- Seguimiento de cuotas pendientes
- Identificación de clientes atrasados
- Reporte de clientes deudores
- Proyección mensual de ingresos
- Estadísticas de pagos
- Exportación de reportes en PDF
- Panel administrativo con inicio de sesión
- Generación guiada de minutas financiadas en Word
- Registro de múltiples compradores y pagos de cuota inicial
- Cálculo automático de financiamiento y cronograma vertical
- Historial de minutas con roles de administrador y asesor

## Tecnologías utilizadas

- React
- TypeScript
- Firebase
- Tailwind CSS
- Vite
- GitHub Actions
- Python y SQLite para el módulo local de minutas

## Desarrollo local integrado

El módulo de minutas vive en `services/minutas` y conserva sus usuarios, sesiones,
borradores y documentos en una base SQLite independiente. No escribe en la colección
de clientes ni en Firebase Storage.

1. Instala las dependencias web con `npm install`.
2. Inicia ambos servicios con `npm run dev:integrado`.
3. Abre la dirección de Vite que aparece en la terminal e ingresa a **Minutas** desde
   el menú lateral.

En el primer arranque se crean contraseñas aleatorias fuertes y se guardan únicamente
en `services/minutas/.env.local`, archivo excluido del repositorio. El comando las
muestra en la terminal local para que puedas iniciar sesión; no deben copiarse al
README ni subirse a GitHub.

### Organización del módulo

```text
src/features/minutas/       Integración visual dentro del panel React
services/minutas/backend/   API, sesiones, validación y motor de documentos
services/minutas/config/    Esquema del formulario
services/minutas/templates/ Plantilla legal protegida
services/minutas/data/      SQLite local (ignorado por Git)
scripts/                    Arranque coordinado de Vite y Python
```

Para ejecutar las verificaciones del generador desde `services/minutas`, usa:

```powershell
python -m unittest discover -s tests -v
```

## Sitio web

https://condominio-villa-hermosa.web.app/

## Repositorio

Este proyecto se mantiene en un repositorio privado:
https://github.com/sergilozada/condominio-villa-hermosa

El despliegue en Firebase es exclusivamente manual. Subir cambios a `main` no
publica automáticamente la aplicación.

## Objetivo del proyecto

El objetivo de este sistema es facilitar la administración comercial y financiera de un proyecto inmobiliario, centralizando la información de clientes, lotes y pagos en una plataforma digital sencilla, rápida y organizada.
