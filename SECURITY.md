# Security Policy

mintit handles wallet keys, payment authentication, and webhook signing — security issues here can mean loss of funds or unauthorized access, not just inconvenience.

## Reporting a vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, use [GitHub Security Advisories](../../security/advisories/new) for this repository ("Report a vulnerability" under the Security tab). This creates a private disclosure thread visible only to you and the maintainers until a fix is ready.

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (or a PoC, if applicable)
- Affected version/commit

## Scope

In scope: anything in this repository — API, admin dashboard, hosted checkout page, webhook delivery/signing, wallet/key handling, Docker deployment configuration.

Out of scope: vulnerabilities in third-party dependencies (report upstream), issues requiring physical access to the host, or social engineering.

## Response

This is a small, actively developed project without a formal SLA. Reports will be acknowledged as promptly as possible, and a fix or mitigation timeline will be shared once the issue is confirmed.
