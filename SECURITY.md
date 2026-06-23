# Security Policy

## Public-Safe Repository Rule

Do not commit:

- real API keys;
- database credentials;
- device secrets;
- WiFi credentials;
- private telemetry;
- production domains or network addresses;
- deployment tokens;
- private hardware configuration.

Use `.env.example` for placeholder names only. Store real values in local environment files or the target deployment secret manager.

## Reporting Issues

If you find a security issue, do not open a public issue containing secrets or exploit details. Contact the repository maintainer privately and include only the minimum information required to reproduce the concern.

## Supported Branch

Security fixes should target the active `main` branch until release branches exist.
