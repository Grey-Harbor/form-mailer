import { createFormMailerError } from './errors.js';
const DEFAULT_MAX_PAYLOAD_BYTES = 64 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const textEncoder = new TextEncoder();
export function isValidEmailAddress(value) {
    return EMAIL_PATTERN.test(value.trim());
}
export function sanitizeHeaderValue(value) {
    return value.replace(/[\r\n]+/g, ' ').trim();
}
export function formatAddress(address) {
    const email = sanitizeHeaderValue(address.email);
    if (!address.name) {
        return email;
    }
    const name = sanitizeHeaderValue(address.name).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${name}" <${email}>`;
}
export function extractEmailAddress(value) {
    const angleMatch = value.match(/<([^>]+)>/);
    if (angleMatch?.[1]) {
        return angleMatch[1].trim();
    }
    return value.trim();
}
export function normalizeAddressList(value) {
    if (!value) {
        return [];
    }
    const values = Array.isArray(value) ? value : [value];
    return values.flatMap((entry) => entry
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean));
}
function byteLength(value) {
    return textEncoder.encode(value).byteLength;
}
function serializeForLimitCheck(submission) {
    return JSON.stringify(submission);
}
function getSubmissionFieldValue(submission, field) {
    if (field in submission) {
        return submission[field];
    }
    if (submission.fields && field in submission.fields) {
        return submission.fields[field];
    }
    return undefined;
}
function isEmptyValue(value) {
    return value === undefined || value === null || value === '';
}
function makeIssue(field, code, message) {
    return { field, code, message };
}
export function validateSubmission(submission, config) {
    const issues = [];
    const requiredFields = config.requiredFields ?? [];
    if (!isValidEmailAddress(String(submission.email ?? ''))) {
        issues.push(makeIssue('email', 'invalid_email', 'A valid email address is required.'));
    }
    for (const field of requiredFields) {
        const value = getSubmissionFieldValue(submission, field);
        if (isEmptyValue(value)) {
            issues.push(makeIssue(field, 'required_field_missing', `The ${field} field is required.`));
        }
    }
    if (config.honeypotFieldName) {
        const honeypotValue = getSubmissionFieldValue(submission, config.honeypotFieldName);
        if (!isEmptyValue(honeypotValue)) {
            issues.push(makeIssue(config.honeypotFieldName, 'honeypot_triggered', 'The submission looks like automated traffic.'));
        }
    }
    if (config.originAllowlist && config.originAllowlist.length > 0) {
        if (!submission.origin) {
            issues.push(makeIssue('origin', 'origin_missing', 'Submission origin is required.'));
        }
        else {
            try {
                const origin = new URL(submission.origin).origin;
                if (!config.originAllowlist.includes(origin)) {
                    issues.push(makeIssue('origin', 'origin_not_allowed', 'The submission origin is not allowed.'));
                }
            }
            catch {
                issues.push(makeIssue('origin', 'origin_invalid', 'The submission origin is invalid.'));
            }
        }
    }
    const maxPayloadBytes = config.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES;
    if (byteLength(serializeForLimitCheck(submission)) > maxPayloadBytes) {
        issues.push(makeIssue('submission', 'payload_too_large', `The submission exceeds the maximum payload size of ${maxPayloadBytes} bytes.`));
    }
    return { ok: issues.length === 0, issues };
}
export function resolveReplyTo(submission, replyTo) {
    const value = typeof replyTo === 'function' ? replyTo(submission) : replyTo;
    const candidate = value ?? submission.email;
    if (!candidate) {
        return undefined;
    }
    const email = extractEmailAddress(candidate);
    if (!isValidEmailAddress(email)) {
        throw createFormMailerError('config_error', 'Invalid reply-to address.');
    }
    return sanitizeHeaderValue(candidate);
}
export function resolveSubject(submission, subject) {
    const value = typeof subject === 'function' ? subject(submission) : subject;
    const fallback = submission.subject ?? `Form submission${submission.name ? ` from ${submission.name}` : ''}`;
    return sanitizeHeaderValue(value ?? fallback);
}
export function resolveRecipients(submission, config) {
    const candidate = submission.recipientKey ? config.recipientMap?.[submission.recipientKey] : undefined;
    const resolved = normalizeAddressList(candidate ?? config.to);
    if (resolved.length === 0) {
        if (submission.recipientKey) {
            throw createFormMailerError('config_error', `No recipient mapping configured for key: ${submission.recipientKey}`);
        }
        throw createFormMailerError('config_error', 'At least one recipient must be configured.');
    }
    return resolved.map((entry) => {
        const email = extractEmailAddress(entry);
        if (!isValidEmailAddress(email)) {
            throw createFormMailerError('config_error', `Invalid recipient address: ${entry}`);
        }
        return sanitizeHeaderValue(entry);
    });
}
export function resolveFromAddress(from) {
    if (typeof from === 'string') {
        const email = extractEmailAddress(from);
        if (!isValidEmailAddress(email)) {
            throw createFormMailerError('config_error', 'Invalid from address.');
        }
        return { email: sanitizeHeaderValue(email) };
    }
    const email = extractEmailAddress(from.email);
    if (!isValidEmailAddress(email)) {
        throw createFormMailerError('config_error', 'Invalid from address.');
    }
    return {
        email: sanitizeHeaderValue(email),
        ...(from.name ? { name: sanitizeHeaderValue(from.name) } : {}),
    };
}
export function resolveConfig(config) {
    if (!config.transport && !config.http && !config.smtp) {
        throw createFormMailerError('config_error', 'Either a transport, HTTP config, or SMTP config must be provided.');
    }
    const from = resolveFromAddress(config.from);
    const to = normalizeAddressList(config.to);
    const hasRecipientMap = Boolean(config.recipientMap && Object.keys(config.recipientMap).length > 0);
    if (to.length === 0 && !hasRecipientMap) {
        throw createFormMailerError('config_error', 'At least one recipient must be configured.');
    }
    const resolved = {
        ...config,
        from,
        to,
        maxPayloadBytes: config.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES,
        honeypotFieldName: config.honeypotFieldName ?? 'website',
        requiredFields: config.requiredFields ?? [],
    };
    return resolved;
}
export function validationFailureError(issues) {
    return createFormMailerError('validation_error', 'Submission validation failed.', {
        issues,
    });
}
//# sourceMappingURL=validation.js.map