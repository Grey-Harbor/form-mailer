import { createFormMailerError } from './errors.js';
function ensureValidUrl(value) {
    try {
        return new URL(value).toString();
    }
    catch {
        throw createFormMailerError('config_error', 'HTTP transport URL must be a valid absolute URL.');
    }
}
function buildHeaders(config) {
    const headers = new Headers({
        'content-type': 'application/json',
        ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
    });
    for (const [name, value] of Object.entries(config.headers ?? {})) {
        headers.set(name, value);
    }
    const contentType = headers.get('content-type');
    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
        headers.set('content-type', 'application/json');
    }
    return headers;
}
function buildRequestInit(baseUrl, config, message) {
    const mappedRequest = config.mapRequest?.(message);
    if (mappedRequest !== undefined && (!mappedRequest || typeof mappedRequest !== 'object' || Array.isArray(mappedRequest))) {
        throw createFormMailerError('transport_error', 'HTTP transport request mapper must return an object.');
    }
    const request = mappedRequest;
    const url = request?.url ? ensureValidMappedUrl(request.url) : baseUrl;
    const headers = buildHeaders(config);
    if (request?.headers) {
        for (const [name, value] of new Headers(request.headers).entries()) {
            headers.set(name, value);
        }
    }
    return {
        url,
        init: {
            method: request?.method ?? 'POST',
            headers,
            body: request?.body ?? JSON.stringify(message),
        },
    };
}
function ensureValidMappedUrl(value) {
    try {
        return new URL(value).toString();
    }
    catch {
        throw createFormMailerError('transport_error', 'HTTP transport request mapper returned an invalid absolute URL.');
    }
}
async function readSafeErrorBody(response) {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType.includes('application/json')) {
        try {
            return await response.json();
        }
        catch {
            return undefined;
        }
    }
    try {
        const body = await response.text();
        const trimmed = body.trim();
        return trimmed ? trimmed.slice(0, 500) : undefined;
    }
    catch {
        return undefined;
    }
}
async function readMessageId(response) {
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('application/json')) {
        return undefined;
    }
    const payload = (await response.json().catch(() => undefined));
    return typeof payload?.messageId === 'string' ? payload.messageId : undefined;
}
export function createHttpTransport(config) {
    const url = ensureValidUrl(config.url);
    return {
        async send(message) {
            const request = buildRequestInit(url, config, message);
            const response = await fetch(request.url, request.init);
            if (!response.ok) {
                const body = await readSafeErrorBody(response);
                throw createFormMailerError('transport_error', `HTTP transport failed with HTTP ${response.status}.`, {
                    status: response.status,
                    statusText: response.statusText,
                    ...(body !== undefined ? { body } : {}),
                });
            }
            if (config.parseResponse) {
                return await config.parseResponse(response);
            }
            const messageId = await readMessageId(response);
            return messageId ? { messageId } : {};
        },
    };
}
//# sourceMappingURL=http.js.map