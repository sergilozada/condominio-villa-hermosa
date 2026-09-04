# Servicio de Minutas

Backend y frontend documental aislados para la integración local con Control Bienes Raíces. Usa su propia base SQLite en `services/minutas/data/villahermosa.db`; no importa Firebase ni modifica la colección de clientes.

La aplicación principal lo presenta bajo `/minutas-service/` y el proxy de Vite dirige `/minutas-api/*` a este servidor. `VH_ALLOW_EMBED` está desactivado por defecto; actívalo únicamente para mostrar el servicio dentro de la aplicación del mismo origen.

## Ejecución desde la raíz del proyecto

En PowerShell, define claves locales de al menos 16 caracteres sin guardarlas en Git:

```powershell
$env:VH_PORT = "8010"
$env:VH_ALLOW_EMBED = "1"
$env:VH_ADMIN_PASSWORD = Read-Host "Clave local del administrador"
$env:VH_ASESOR_PASSWORD = Read-Host "Clave local del asesor"
python services/minutas/server.py
```

Las variables de contraseña solo crean cuentas que todavía no existen. El archivo `.env.example` documenta la configuración, pero el servicio no carga archivos `.env` automáticamente.

Para verificar el servicio desde la raíz:

```powershell
Push-Location services/minutas
python -m unittest discover -s tests -v
Pop-Location
```
