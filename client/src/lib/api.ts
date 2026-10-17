const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    let response = await fetch(`${API_BASE}${path}`, config);

    // Endpoints that should NEVER trigger refresh
    const isAuthPath =
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/signup') ||
      path.startsWith('/auth/refresh') ||
      path.startsWith('/auth/logout');

    // Try silent refresh on 401 for non-auth paths
    if (response.status === 401 && !isAuthPath) {
      const refreshed = await this.attemptRefresh();
      if (refreshed) {
        response = await fetch(`${API_BASE}${path}`, config);
      } else {
        // If /auth/me fails, user is simply not logged in yet — don't redirect
        // For actual protected data requests, redirect to login
        const isPublicPage =
          window.location.pathname === '/login' || window.location.pathname === '/signup';

        if (!isPublicPage && path !== '/auth/me') {
          window.location.href = '/login?expired=1';
        }
        const error = new Error('Session expired') as any;
        error.status = 401;
        throw error;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData?.error?.message || 'Request failed') as any;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  private async attemptRefresh(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PUT', body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body });
  }
}

export const api = new ApiClient();
