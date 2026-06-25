import type { SerializableValue } from './serialize.js';

export type SubmissionPrimitive = string | number | boolean | null | undefined;

export type SubmissionValue = SerializableValue;

export type SubmissionFields = Record<string, SubmissionValue>;

export interface FormMailSubmission<TFields extends SubmissionFields = SubmissionFields> {
  name?: string | undefined;
  email?: string | undefined;
  subject?: string | undefined;
  message?: string | undefined;
  recipientKey?: string | undefined;
  origin?: string | undefined;
  honeypot?: string | undefined;
  fields?: TFields | undefined;
}

export interface MailAddress {
  name?: string | undefined;
  email: string;
}

export interface SmtpConnectionConfig {
  host?: string | undefined;
  port?: number | undefined;
  secure?: boolean | undefined;
  starttls?: boolean | undefined;
  username?: string | undefined;
  password?: string | undefined;
  token?: string | undefined;
  tls?: {
    rejectUnauthorized?: boolean | undefined;
    servername?: string | undefined;
  };
}

export type HttpTransportHeaders = Headers | Record<string, string> | Array<[string, string]>;

export type HttpTransportBody = string | Uint8Array | ArrayBuffer;

export interface HttpTransportRequest {
  url?: string | undefined;
  method?: string | undefined;
  headers?: HttpTransportHeaders | undefined;
  body?: HttpTransportBody | undefined;
}

export interface HttpTransportConfig {
  url: string;
  token?: string | undefined;
  headers?: Record<string, string> | undefined;
  mapRequest?: ((message: OutgoingMail) => HttpTransportRequest) | undefined;
  parseResponse?: ((response: Response) => Promise<TransportSendResult> | TransportSendResult) | undefined;
}

export interface FormMailerConfig {
  from: string | MailAddress;
  to?: string | string[] | undefined;
  recipientMap?: Record<string, string | string[]> | undefined;
  subject?: string | ((submission: FormMailSubmission) => string) | undefined;
  replyTo?: string | ((submission: FormMailSubmission) => string | undefined) | undefined;
  originAllowlist?: string[] | undefined;
  honeypotFieldName?: string | undefined;
  requiredFields?: string[] | undefined;
  maxPayloadBytes?: number | undefined;
  transport?: MailTransport | undefined;
  http?: HttpTransportConfig | undefined;
  smtp?: SmtpConnectionConfig | undefined;
}

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export type FormMailerErrorCode =
  | 'config_error'
  | 'validation_error'
  | 'transport_error'
  | 'smtp_error';

export interface FormMailerError extends Error {
  code: FormMailerErrorCode;
  details?: Record<string, unknown> | undefined;
}

export interface OutgoingMail {
  from: string;
  to: string[];
  replyTo?: string | undefined;
  subject: string;
  text: string;
  html?: string | undefined;
}

export interface TransportSendResult {
  messageId?: string | undefined;
}

export interface MailTransport {
  send(message: OutgoingMail): Promise<TransportSendResult>;
}

export interface SendMailResult {
  ok: true;
  messageId?: string | undefined;
  envelope: {
    from: string;
    to: string[];
  };
}

export interface SendMailFailure {
  ok: false;
  error: FormMailerError;
}

export type SendMailOutcome = SendMailResult | SendMailFailure;

export interface FormMailer {
  validate(submission: FormMailSubmission): ValidationResult;
  send(submission: FormMailSubmission): Promise<SendMailOutcome>;
}

export interface ResolvedFormMailerConfig extends Omit<FormMailerConfig, 'from'> {
  from: MailAddress;
  to: string[];
  transport?: MailTransport | undefined;
  maxPayloadBytes: number;
  honeypotFieldName: string;
  requiredFields: string[];
}
