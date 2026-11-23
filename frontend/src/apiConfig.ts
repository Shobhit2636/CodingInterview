/**
 * Dynamic API Base URL configuration.
 * - When in Vite dev mode on port 5173, connects to current hostname on port 5000 (e.g. localhost:5000 or 192.168.x.x:5000).
 * - When served by backend in production or over public tunnel/URL, uses window.location.origin.
 * - Can be overridden via VITE_API_URL.
 */
const metaEnv = (import.meta as any).env;

export const API_BASE_URL: string =
  (metaEnv?.VITE_API_URL as string) ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5000');

export const SOCKET_URL: string = API_BASE_URL;
