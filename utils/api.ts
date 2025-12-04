
// utils/api.ts

// Use environment variable for production. If it's not set (e.g. Vercel env not available),
// allow a runtime `config.json` served from the frontend to provide the `API_URL`.
let rawUrl = (import.meta as any).env?.VITE_API_URL;
let BASE_URL = rawUrl ? rawUrl.replace(/\/$/, '') : '';

let runtimeConfigLoaded = false;
let runtimeConfigLoading: Promise<void> | null = null;

const loadRuntimeConfig = async () => {
    if (runtimeConfigLoaded) return;
    if (runtimeConfigLoading) return runtimeConfigLoading;

    runtimeConfigLoading = (async () => {
        try {
            // Try fetch a JSON file at /config.json that can contain { "API_URL": "https://..." }
            const res = await fetch('/config.json', { cache: 'no-store' });
            if (res.ok) {
                const cfg = await res.json().catch(() => null);
                if (cfg && cfg.API_URL && typeof cfg.API_URL === 'string') {
                    BASE_URL = cfg.API_URL.replace(/\/$/, '');
                }
            }
        } catch (e) {
            // ignore; runtime config optional
        } finally {
            runtimeConfigLoaded = true;
            runtimeConfigLoading = null;
        }
    })();

    return runtimeConfigLoading;
};

const apiRequest = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: object) => {
    const isGetWithParams = method === 'GET' && path.startsWith('?');

    // Ensure runtime config has loaded if BASE_URL not set
    if (!BASE_URL) {
        await loadRuntimeConfig();
    }

    const url = isGetWithParams ? `${BASE_URL}${path}&_=${Date.now()}` : `${BASE_URL}${path}`;
    
    // Increased timeout to 5 seconds for better reliability
    const controller = new AbortController();
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => {
            controller.abort();
            reject(new Error('Request timed out'));
        }, 5000)
    );

    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
    };

    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }

    try {
        // Race the fetch against the timeout
        const response = await Promise.race([
            fetch(url, options),
            timeoutPromise
        ]);

        if (response.status === 204) return null;

        const contentType = response.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
             throw new Error("Backend connection failed: Invalid response type.");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Server error' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error: any) {
        // Handle AbortError specifically from the controller
        if (error.name === 'AbortError' || error.message === 'Request timed out') {
             throw new Error('Connection timed out. Server is unreachable.');
        }
        
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error('Network error: Unable to connect to backend.');
        }
        throw error;
    }
};

export const apiGet = (path: string) => apiRequest('GET', path);
export const apiPost = (path: string, body: object) => apiRequest('POST', path, body);
export const apiPut = (path: string, body: object) => apiRequest('PUT', path, body);
export const apiDelete = (path: string) => apiRequest('DELETE', path);
