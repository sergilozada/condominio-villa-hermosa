import { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  CircleAlert,
  Database,
  ExternalLink,
  FileSignature,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const HEALTH_ENDPOINT = '/minutas-api/health';
const CONFIGURED_SERVICE_URL = String(import.meta.env.VITE_MINUTAS_SERVICE_URL || '').trim();
const EXTERNAL_SERVICE_URL = (() => {
  if (!CONFIGURED_SERVICE_URL) return null;

  try {
    const url = new URL(CONFIGURED_SERVICE_URL);
    if (
      url.protocol !== 'https:' || url.username || url.password ||
      url.origin === window.location.origin
    ) return null;

    return url.href;
  } catch {
    return null;
  }
})();
const IS_EXTERNAL_SERVICE = EXTERNAL_SERVICE_URL !== null;
const IS_LOCAL_SERVICE = import.meta.env.DEV && !CONFIGURED_SERVICE_URL;
const IS_UNCONFIGURED = !IS_EXTERNAL_SERVICE && !IS_LOCAL_SERVICE;
const MINUTAS_SERVICE_URL = EXTERNAL_SERVICE_URL ?? '/minutas-service/';

type ServiceState = 'checking' | 'ready' | 'error' | 'unconfigured';

export default function MinutasWorkspace() {
  const [serviceState, setServiceState] = useState<ServiceState>(IS_UNCONFIGURED ? 'unconfigured' : 'checking');
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);

  const checkService = useCallback(async (signal?: AbortSignal) => {
    setServiceState('checking');

    try {
      const response = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal,
      });

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        throw new Error('Health check did not return JSON');
      }

      const payload = await response.json() as { ok?: unknown; service?: unknown };
      if (payload.ok !== true || payload.service !== 'Villa Hermosa Minutas') {
        throw new Error('Health check returned an unexpected service');
      }

      setFrameLoading(true);
      setServiceState('ready');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setServiceState('error');
    }
  }, []);

  useEffect(() => {
    if (IS_UNCONFIGURED) return;

    if (IS_EXTERNAL_SERVICE) {
      setServiceState('ready');
      setFrameLoading(false);
      return;
    }

    const controller = new AbortController();
    void checkService(controller.signal);

    return () => controller.abort();
  }, [checkService]);

  const reloadWorkspace = () => {
    if (serviceState !== 'ready') {
      void checkService();
      return;
    }

    setFrameLoading(true);
    setFrameKey(currentKey => currentKey + 1);
  };

  const status = (() => {
    if (IS_UNCONFIGURED) {
      return {
        label: 'Acceso web pendiente de configurar',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
        icon: <CircleAlert className="h-4 w-4" aria-hidden="true" />,
      };
    }

    if (IS_EXTERNAL_SERVICE) {
      return {
        label: 'Acceso web configurado',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: <BadgeCheck className="h-4 w-4" aria-hidden="true" />,
      };
    }

    if (serviceState === 'checking') {
      return {
        label: 'Comprobando servicio local',
        className: 'border-[#c7ddd9] bg-[#eef8f6] text-[#0d6f78]',
        icon: <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />,
      };
    }

    if (serviceState === 'error') {
      return {
        label: 'Servicio local no disponible',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: <CircleAlert className="h-4 w-4" aria-hidden="true" />,
      };
    }

    if (frameLoading) {
      return {
        label: 'Servicio disponible · cargando panel',
        className: 'border-[#c7ddd9] bg-[#eef8f6] text-[#0d6f78]',
        icon: <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />,
      };
    }

    return {
      label: 'Servicio local disponible',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: <BadgeCheck className="h-4 w-4" aria-hidden="true" />,
    };
  })();

  return (
    <section className="space-y-5" aria-labelledby="minutas-workspace-title">
      <header className="relative isolate overflow-hidden rounded-3xl border border-[#16335c]/10 bg-[#0e1c37] px-5 py-6 text-white shadow-xl shadow-[#15284d]/10 sm:px-7 sm:py-7">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(20,142,152,0.46),transparent_46%),linear-gradient(135deg,#0e1c37_0%,#15284d_68%,#0d6f78_100%)]"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#148e98] via-[#c9a24d] to-transparent" aria-hidden="true" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-lg shadow-black/15 sm:h-16 sm:w-16">
              <img
                src="/brand/villa-hermosa-icon.png"
                alt=""
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#b9ebe5]">
                <FileSignature className="h-4 w-4" aria-hidden="true" />
                Gestión documental
              </div>
              <h1 id="minutas-workspace-title" className="brand-display text-3xl font-medium tracking-tight sm:text-4xl">
                Minutas Villa Hermosa
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Completa, revisa y genera contratos con su cronograma de pagos desde un espacio independiente.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <div
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-semibold ${status.className}`}
              role="status"
              aria-live="polite"
            >
              {status.icon}
              <span>{status.label}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {IS_LOCAL_SERVICE && (
                <button
                  type="button"
                  onClick={reloadWorkspace}
                  disabled={serviceState === 'checking'}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/35 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79d9cf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1c37] disabled:cursor-wait disabled:opacity-60 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 ${serviceState === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Recargar
                </button>
              )}
              {(IS_EXTERNAL_SERVICE || (IS_LOCAL_SERVICE && serviceState === 'ready')) && <a
                href={MINUTAS_SERVICE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0d6f78] px-4 text-sm font-semibold text-white shadow-lg shadow-black/15 transition hover:bg-[#07565d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#79d9cf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1c37] motion-reduce:transition-none sm:flex-none"
              >
                {IS_EXTERNAL_SERVICE ? 'Abrir Minutas' : 'Abrir en pestaña'}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-[#d9ddd9] bg-[#fffefb] px-4 py-3.5 shadow-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6f6f3] text-[#0d6f78]">
            <Database className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#15284d]">Almacenamiento independiente</p>
            <p className="mt-0.5 text-sm leading-5 text-[#697386]">
              {IS_EXTERNAL_SERVICE
                ? 'Minutas usa una base Supabase separada de la cartera de clientes.'
                : IS_LOCAL_SERVICE
                  ? 'Este módulo usa su propia base SQLite local.'
                  : 'Minutas conserva sus documentos en un almacenamiento separado de la cartera de clientes.'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-[#d9ddd9] bg-[#fffefb] px-4 py-3.5 shadow-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff7e3] text-[#8a6215]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#15284d]">Datos protegidos</p>
            <p className="mt-0.5 text-sm leading-5 text-[#697386]">Crear o editar minutas aquí NO modifica la base de Firebase.</p>
          </div>
        </div>
      </div>

      {IS_UNCONFIGURED ? (
        <div className="rounded-3xl border border-[#d9ddd9] bg-white px-6 py-12 text-center shadow-xl shadow-[#15284d]/10 sm:px-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-800">
            <CircleAlert className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-[#15284d]">El acceso a Minutas aún no está configurado</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#697386]">
            Falta configurar un enlace web válido al sistema de Minutas. Contacta al administrador para habilitar este acceso.
          </p>
        </div>
      ) : IS_EXTERNAL_SERVICE ? (
        <div className="relative isolate overflow-hidden rounded-3xl border border-[#d9ddd9] bg-white px-6 py-12 text-center shadow-xl shadow-[#15284d]/10 sm:px-10 sm:py-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(20,142,152,0.12),transparent_54%)]" aria-hidden="true" />
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#e6f6f3] text-[#0d6f78] shadow-sm">
            <FileSignature className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#15284d]">Sistema de Minutas en línea</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#697386] sm:text-base">
            Abre el espacio documental seguro para registrar compradores, preparar contratos y descargar cronogramas.
          </p>
          <a
            href={MINUTAS_SERVICE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0d6f78] px-6 text-sm font-semibold text-white shadow-lg shadow-[#0d6f78]/20 transition hover:-translate-y-0.5 hover:bg-[#07565d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148e98] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
          >
            Abrir sistema de Minutas
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-4 text-xs leading-5 text-[#7a8495]">
            Se abre en una pestaña independiente para mantener protegida tu sesión.
          </p>
        </div>
      ) : (
        <div
          className="relative min-h-[760px] overflow-hidden rounded-3xl border border-[#d9ddd9] bg-white shadow-xl shadow-[#15284d]/10 lg:h-[calc(100vh-9rem)] lg:max-h-[1180px]"
          aria-busy={serviceState === 'checking' || frameLoading}
        >
        {serviceState === 'checking' && (
          <div className="absolute inset-0 z-10 space-y-5 bg-[#f7f7f3] p-5 sm:p-7" aria-label="Cargando módulo de minutas">
            <div className="flex animate-pulse items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[#dfe7e4]" />
              <div className="space-y-2">
                <div className="h-4 w-44 rounded-full bg-[#dfe7e4]" />
                <div className="h-3 w-64 max-w-[70vw] rounded-full bg-[#e9ece9]" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className="h-[610px] animate-pulse rounded-2xl bg-[#e9ece9]" />
              <div className="space-y-4">
                <div className="h-40 animate-pulse rounded-2xl bg-[#dfe7e4]" />
                <div className="h-64 animate-pulse rounded-2xl bg-[#e9ece9]" />
              </div>
            </div>
          </div>
        )}

        {serviceState === 'error' && (
          <div className="absolute inset-0 grid place-items-center bg-[#f7f7f3] p-5">
            <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-lg shadow-[#15284d]/5 sm:p-9">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                <CircleAlert className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-[#15284d]">No pudimos abrir el módulo de minutas</h2>
              <p className="mt-2 text-sm leading-6 text-[#697386]">
                Comprueba que el servicio local esté iniciado y vuelve a intentarlo. Tus datos permanecen sin cambios.
              </p>
              <button
                type="button"
                onClick={() => void checkService()}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0d6f78] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#07565d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#148e98] focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reintentar conexión
              </button>
            </div>
          </div>
        )}

        {serviceState === 'ready' && (
          <>
            {frameLoading && (
              <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-white/90 backdrop-blur-sm">
                <div className="text-center" role="status" aria-live="polite">
                  <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#148e98]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-[#15284d]">Preparando el panel de minutas…</p>
                </div>
              </div>
            )}
            <iframe
              key={frameKey}
              src={MINUTAS_SERVICE_URL}
              title="Sistema de generación de minutas Villa Hermosa"
              className="h-full min-h-[760px] w-full border-0 bg-white"
              referrerPolicy="same-origin"
              onLoad={() => setFrameLoading(false)}
            />
          </>
        )}
        </div>
      )}
    </section>
  );
}
