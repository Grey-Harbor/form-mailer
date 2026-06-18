# How-To: Configuration

This guide shows the configuration options that matter in practice.

## Configuration sources

`form-mailer` can be configured from:

- inline code
- environment variables
- a config file in the deployment root

## Config file discovery

By default, the loader looks for `configs.yaml` in the deployment root.

If `configs.yaml` is not present, a legacy `config.yaml` file is also accepted.

If the config is mounted somewhere else, set `FORM_MAILER_CONFIG_PATH` to the full path.
`FORM_MAILER_CONFIG_FILE` is still accepted as a compatibility alias.

## Environment variables

Common environment variables include:

- `FORM_MAILER_FROM`
- `FORM_MAILER_TO`
- `FORM_MAILER_SMTP_HOST`
- `FORM_MAILER_SMTP_USERNAME`
- `FORM_MAILER_SMTP_PASSWORD`
- `FORM_MAILER_CONFIG_PATH`

## Recipient mapping

You can map logical form destinations to email recipients by setting `recipientMap` in code or the equivalent YAML structure in config.

## Practical defaults

- keep `from` as a real mailbox
- use `starttls` for SMTP hosts that support it
- keep `replyTo` aligned with the submitter email when you want replies to go back to the user

