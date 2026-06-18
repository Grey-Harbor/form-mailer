export type SubmissionPrimitive = string | number | boolean | null | undefined;

export type SubmissionValue = SubmissionPrimitive | SubmissionPrimitive[];

export type SubmissionFields = Record<string, SubmissionValue>;

export interface FormMailSubmission<TFields extends SubmissionFields = SubmissionFields> {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  recipientKey?: string;
  origin?: string;
  honeypot?: string;
  fields?: TFields;
}

export interface MailAddress {
  name?: string;
  email: string;
}

export interface SmtpConnectionConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  starttls?: boolean;
  username?: string;
  password?: string;
  tls?: {
    rejectUnauthorized?: boolean;
    servername?: string;
  };
}

export interface FormMailerConfig {
  from: string | MailAddress;
  to?: string | string[];
  recipientMap?: Record<string, string | string[]>;
  subject?: string | ((submission: FormMailSubmission) => string);
  replyTo?: string | ((submission: FormMailSubmission) => string | undefined);
  originAllowlist?: string[];
  honeypotFieldName?: string;
  requiredFields?: string[];
  maxPayloadBytes?: number;
  transport?: MailTransport;
  smtp?: SmtpConnectionConfig;
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
  details?: Record<string, unknown>;
}

export interface OutgoingMail {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface TransportSendResult {
  messageId?: string;
}

export interface MailTransport {
  send(message: OutgoingMail): Promise<TransportSendResult>;
}

export interface SendMailResult {
  ok: true;
  messageId?: string;
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
  transport?: MailTransport;
  maxPayloadBytes: number;
  honeypotFieldName: string;
  requiredFields: string[];
}
