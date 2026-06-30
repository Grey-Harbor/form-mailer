import * as net from 'node:net';
import * as tls from 'node:tls';
import { randomUUID } from 'node:crypto';
import { createFormMailerError } from './errors.js';
import { buildRawMessage } from './mail.js';
let cloudflareSocketsModulePromise = null;
async function loadCloudflareSocketsModule() {
    // @ts-expect-error cloudflare:sockets is only available in Workers runtimes.
    cloudflareSocketsModulePromise ??= import('cloudflare:sockets')
        .then((mod) => mod)
        .catch(() => null);
    return cloudflareSocketsModulePromise;
}
function createLineReader(socket) {
    let buffer = '';
    const waiters = [];
    const lines = [];
    let closedError = null;
    let closed = false;
    socket.setEncoding('utf8');
    const settleWaiters = (error) => {
        while (waiters.length > 0) {
            waiters.shift()?.reject(error);
        }
    };
    const onData = (chunk) => {
        if (closed) {
            return;
        }
        buffer += chunk;
        let index = buffer.indexOf('\n');
        while (index !== -1) {
            const line = buffer.slice(0, index).replace(/\r$/, '');
            buffer = buffer.slice(index + 1);
            const waiter = waiters.shift()?.resolve;
            if (waiter) {
                waiter(line);
            }
            else {
                lines.push(line);
            }
            index = buffer.indexOf('\n');
        }
    };
    const onError = (error) => {
        closedError = error;
        settleWaiters(error);
    };
    const onClose = () => {
        closedError ??= new Error('SMTP connection closed.');
        if (closedError) {
            settleWaiters(closedError);
        }
    };
    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('close', onClose);
    return {
        nextLine() {
            if (lines.length > 0) {
                return Promise.resolve(lines.shift() ?? '');
            }
            if (closedError) {
                return Promise.reject(closedError);
            }
            return new Promise((resolve, reject) => {
                waiters.push({ resolve, reject });
            });
        },
        close(error = new Error('SMTP reader closed.')) {
            if (closed) {
                return;
            }
            closed = true;
            closedError ??= error;
            try {
                socket.off('data', onData);
            }
            catch {
                // Some runtimes throw while detaching a locked reader.
            }
            try {
                socket.off('error', onError);
            }
            catch {
                // Preserve the original SMTP failure.
            }
            try {
                socket.off('close', onClose);
            }
            catch {
                // Preserve the original SMTP failure.
            }
            settleWaiters(closedError);
        },
    };
}
async function readResponse(reader) {
    const lines = [];
    let code = 0;
    while (true) {
        const line = await reader.nextLine();
        if (!line) {
            throw createFormMailerError('smtp_error', 'Unexpected empty SMTP response.');
        }
        lines.push(line);
        const match = line.match(/^(\d{3})([ -])(.*)$/);
        if (!match) {
            continue;
        }
        code = Number(match[1]);
        if (match[2] === ' ') {
            return { code, lines };
        }
    }
}
async function writeCommand(socket, command) {
    socket.write(`${command}\r\n`);
}
async function writeStreamCommand(writer, command) {
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(`${command}\r\n`));
}
async function closeWriter(writer) {
    try {
        await writer.close();
    }
    catch {
        // Preserve the SMTP failure that caused cleanup.
    }
    finally {
        try {
            writer.releaseLock();
        }
        catch {
            // Some runtimes can still reject lock release during teardown.
        }
    }
}
function releaseWriterLock(writer) {
    try {
        writer.releaseLock();
    }
    catch {
        // Some runtimes can still reject lock release during teardown.
    }
}
async function expectCode(reader, socket, command, expected) {
    await writeCommand(socket, command);
    const response = await readResponse(reader);
    const expectedCodes = Array.isArray(expected) ? expected : [expected];
    if (!expectedCodes.includes(response.code)) {
        throw createFormMailerError('smtp_error', `SMTP command failed: ${command.split(' ')[0]}`, {
            command,
            response,
        });
    }
    return response;
}
function connectSocket(config) {
    const port = config.port ?? (config.secure ? 465 : 587);
    const host = config.host;
    if (!host) {
        throw createFormMailerError('config_error', 'SMTP host is required.');
    }
    if (config.secure) {
        return new Promise((resolve, reject) => {
            const connection = tls.connect({
                host,
                port,
                servername: config.tls?.servername ?? host,
                rejectUnauthorized: config.tls?.rejectUnauthorized ?? true,
            }, () => resolve(connection));
            connection.on('error', reject);
        });
    }
    return new Promise((resolve, reject) => {
        const connection = net.connect({ host, port }, () => resolve(connection));
        connection.on('error', reject);
    });
}
function upgradeToTls(socket, config) {
    return new Promise((resolve, reject) => {
        const tlsSocket = tls.connect({
            socket,
            servername: config.tls?.servername ?? config.host,
            rejectUnauthorized: config.tls?.rejectUnauthorized ?? true,
        }, () => resolve(tlsSocket));
        tlsSocket.on('error', reject);
    });
}
function escapeDotStuffing(message) {
    return message.replace(/(^|\r\n)\./g, '$1..');
}
function getSmtpAuthCredentials(config) {
    if (!config.password) {
        return null;
    }
    return {
        username: config.username ?? '',
        password: config.password,
    };
}
export function createSmtpTransport(config, hooks = {}) {
    return {
        async send(message) {
            const cloudflareSockets = await loadCloudflareSocketsModule();
            if (cloudflareSockets) {
                return sendWithCloudflareTransport(config, message, cloudflareSockets);
            }
            return sendWithNodeTransport(config, message, hooks);
        },
    };
}
async function sendWithNodeTransport(config, message, hooks) {
    const socket = await (hooks.connect ?? connectSocket)(config);
    let activeSocket = socket;
    let reader = createLineReader(activeSocket);
    let greeted = false;
    try {
        await readResponse(reader);
        greeted = true;
        await expectCode(reader, activeSocket, `EHLO ${config.tls?.servername ?? config.host ?? 'localhost'}`, [250]);
        if (config.starttls && !config.secure) {
            await expectCode(reader, activeSocket, 'STARTTLS', 220);
            activeSocket = await (hooks.upgradeToTls ?? upgradeToTls)(socket, config);
            reader = createLineReader(activeSocket);
            await expectCode(reader, activeSocket, `EHLO ${config.tls?.servername ?? config.host ?? 'localhost'}`, [250]);
        }
        const authCredentials = getSmtpAuthCredentials(config);
        if (authCredentials) {
            await expectCode(reader, activeSocket, 'AUTH LOGIN', 334);
            await expectCode(reader, activeSocket, Buffer.from(authCredentials.username).toString('base64'), 334);
            await expectCode(reader, activeSocket, Buffer.from(authCredentials.password).toString('base64'), 235);
        }
        const envelopeFrom = message.from.match(/<([^>]+)>/)?.[1] ?? message.from;
        await expectCode(reader, activeSocket, `MAIL FROM:<${envelopeFrom}>`, 250);
        for (const recipient of message.to) {
            const envelopeTo = recipient.match(/<([^>]+)>/)?.[1] ?? recipient;
            await expectCode(reader, activeSocket, `RCPT TO:<${envelopeTo}>`, [250, 251]);
        }
        await expectCode(reader, activeSocket, 'DATA', 354);
        const rawMessage = escapeDotStuffing(buildRawMessage(message));
        activeSocket.write(`${rawMessage}\r\n.\r\n`);
        const dataResponse = await readResponse(reader);
        if (![250, 251].includes(dataResponse.code)) {
            throw createFormMailerError('smtp_error', 'SMTP server rejected the message body.', {
                response: dataResponse,
            });
        }
        await expectCode(reader, activeSocket, 'QUIT', 221).catch(() => undefined);
        activeSocket.end();
        return {
            messageId: hooks.messageIdFactory?.() ?? `<${randomUUID()}@form-mailer.local>`,
        };
    }
    catch (error) {
        reader.close(error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'SMTP send failed.'));
        try {
            activeSocket.end();
        }
        catch {
            try {
                activeSocket.destroy();
            }
            catch {
                // Preserve the original SMTP failure if socket teardown is unhappy.
            }
        }
        if (error instanceof Error && 'code' in error) {
            throw error;
        }
        throw createFormMailerError('smtp_error', 'SMTP send failed.', {
            cause: error instanceof Error ? error.message : String(error),
        });
    }
}
async function createCloudflareReader(socket) {
    const reader = socket.readable.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let ended = false;
    return {
        async nextLine() {
            while (true) {
                const newlineIndex = buffer.indexOf('\n');
                if (newlineIndex !== -1) {
                    const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
                    buffer = buffer.slice(newlineIndex + 1);
                    return line;
                }
                if (ended) {
                    const line = buffer.replace(/\r$/, '');
                    buffer = '';
                    if (line) {
                        return line;
                    }
                    throw createFormMailerError('smtp_error', 'SMTP connection closed.');
                }
                const chunk = await reader.read();
                if (chunk.done) {
                    buffer += decoder.decode();
                    ended = true;
                    continue;
                }
                buffer += decoder.decode(chunk.value, { stream: true });
            }
        },
        close() {
            ended = true;
            try {
                reader.releaseLock();
            }
            catch {
                // Preserve the SMTP failure that caused cleanup.
            }
        },
    };
}
async function sendWithCloudflareTransport(config, message, sockets) {
    const host = config.host;
    if (!host) {
        throw createFormMailerError('config_error', 'SMTP host is required.');
    }
    const port = config.port ?? (config.secure ? 465 : 587);
    const secureTransport = config.secure ? 'on' : config.starttls ? 'starttls' : 'off';
    const socket = sockets.connect({ hostname: host, port }, { secureTransport, allowHalfOpen: true });
    await socket.opened;
    let activeSocket = socket;
    let reader = await createCloudflareReader(activeSocket);
    let writer = activeSocket.writable.getWriter();
    try {
        await readResponse(reader);
        await expectCodeStream(reader, writer, `EHLO ${config.tls?.servername ?? host ?? 'localhost'}`, [250]);
        if (config.starttls && !config.secure) {
            await expectCodeStream(reader, writer, 'STARTTLS', 220);
            releaseWriterLock(writer);
            reader.close();
            activeSocket = activeSocket.startTls();
            await activeSocket.opened;
            reader = await createCloudflareReader(activeSocket);
            writer = activeSocket.writable.getWriter();
            await expectCodeStream(reader, writer, `EHLO ${config.tls?.servername ?? host ?? 'localhost'}`, [250]);
        }
        const authCredentials = getSmtpAuthCredentials(config);
        if (authCredentials) {
            await expectCodeStream(reader, writer, 'AUTH LOGIN', 334);
            await expectCodeStream(reader, writer, Buffer.from(authCredentials.username).toString('base64'), 334);
            await expectCodeStream(reader, writer, Buffer.from(authCredentials.password).toString('base64'), 235);
        }
        const envelopeFrom = message.from.match(/<([^>]+)>/)?.[1] ?? message.from;
        await expectCodeStream(reader, writer, `MAIL FROM:<${envelopeFrom}>`, 250);
        for (const recipient of message.to) {
            const envelopeTo = recipient.match(/<([^>]+)>/)?.[1] ?? recipient;
            await expectCodeStream(reader, writer, `RCPT TO:<${envelopeTo}>`, [250, 251]);
        }
        await expectCodeStream(reader, writer, 'DATA', 354);
        const rawMessage = escapeDotStuffing(buildRawMessage(message));
        await writeStreamCommand(writer, `${rawMessage}\r\n.\r\n`);
        const dataResponse = await readResponse(reader);
        if (![250, 251].includes(dataResponse.code)) {
            throw createFormMailerError('smtp_error', 'SMTP server rejected the message body.', {
                response: dataResponse,
            });
        }
        await expectCodeStream(reader, writer, 'QUIT', 221).catch(() => undefined);
        await closeWriter(writer);
        await activeSocket.close().catch(() => undefined);
        return {
            messageId: `<${randomUUID()}@form-mailer.local>`,
        };
    }
    catch (error) {
        try {
            await closeWriter(writer);
        }
        catch {
            // Preserve the original SMTP failure.
        }
        releaseWriterLock(writer);
        try {
            await activeSocket.close();
        }
        catch {
            // Preserve the original SMTP failure.
        }
        if (error instanceof Error && 'code' in error) {
            throw error;
        }
        throw createFormMailerError('smtp_error', 'SMTP send failed.', {
            cause: error instanceof Error ? error.message : String(error),
        });
    }
}
async function expectCodeStream(reader, writer, command, expected) {
    await writeStreamCommand(writer, command);
    const response = await readResponse(reader);
    const expectedCodes = Array.isArray(expected) ? expected : [expected];
    if (!expectedCodes.includes(response.code)) {
        throw createFormMailerError('smtp_error', `SMTP command failed: ${command.split(' ')[0]}`, {
            command,
            response,
        });
    }
    return response;
}
//# sourceMappingURL=smtp.js.map