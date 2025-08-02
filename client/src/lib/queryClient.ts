import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text;
    try {
      text = await res.text();
    } catch {
      text = res.statusText;
    }
    throw new Error(`${res.status}: ${text || 'Unknown error'}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get sessionId from localStorage
  const sessionId = localStorage.getItem('sessionId');
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  if (sessionId) {
    headers['Authorization'] = `Bearer ${sessionId}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Don't throw for login/register requests, let them handle their own errors
  if (method === 'POST' && (url.includes('/login') || url.includes('/register'))) {
    return res;
  }
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get sessionId from localStorage
    const sessionId = localStorage.getItem('sessionId');
    const headers: HeadersInit = {};
    
    if (sessionId) {
      headers['Authorization'] = `Bearer ${sessionId}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
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
