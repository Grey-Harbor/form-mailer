export function createFormMailerError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details && Object.keys(details).length > 0) {
        error.details = details;
    }
    return error;
}
export function isFormMailerError(value) {
    return Boolean(value &&
        typeof value === 'object' &&
        'code' in value &&
        typeof value.code === 'string');
}
//# sourceMappingURL=errors.js.map