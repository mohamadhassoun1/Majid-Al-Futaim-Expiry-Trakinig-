
// utils/api.ts

// Use environment variable for production.
const rawUrl = (import.meta as any).env?.VITE_API_URL;
const BASE_URL = rawUrl ? rawUrl.replace(/\/$/, '') : '';

const apiRequest = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: object) => {
    const isGetWithParams = method === 'GET' && path.startsWith('?');
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
