import { api, demoApi } from "@/lib/api";

// Devuelve el cliente demo o el real según la variable de entorno
export function useApi() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  return isDemo ? demoApi : api;
}
