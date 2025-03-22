import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add a unique timestamp to bypass any caching
  const urlWithTimestamp = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  
  const res = await fetch(urlWithTimestamp, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest" // Indicates this is an AJAX request
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
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
    // Add a timestamp to bypass caching
    const url = queryKey[0] as string;
    const urlWithTimestamp = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    
    const res = await fetch(urlWithTimestamp, {
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Handle potential non-JSON responses
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Response is not JSON:', text.substring(0, 500) + '...');
        throw new Error('API did not return JSON. Check console for details.');
      }
    }
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
