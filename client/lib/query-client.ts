import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import "@/lib/firebase"; // ensure Firebase is initialized

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const user = getAuth().currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    return "https://equra-backend-173860771473.europe-west1.run.app";
  }

  // Preserve explicit http:// / https:// scheme (required for local-dev backends)
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return new URL(host).href;
  }

  let url = new URL(`https://${host}`);

  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
  options?: { signal?: AbortSignal },
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method,
    headers: { ...authHeaders, ...(data ? { "Content-Type": "application/json" } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    signal: options?.signal,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const authHeaders = await getAuthHeaders();
    const res = await fetch(url, {
      headers: authHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
