# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active |
| < 1.0   | ❌ No longer supported |

## Reporting a Vulnerability

We take the security of this project seriously. If you discover a security vulnerability, please **do not** open a public issue.

Instead, report it privately by emailing the repository owner or opening a **confidential issue** through GitHub's security advisory feature:

1. Go to the repository's **Security** tab
2. Click **"Report a vulnerability"**
3. Provide a detailed description, including:
   - Type of vulnerability
   - Steps to reproduce
   - Affected versions
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment:** Within 48 hours of your report
- **Status update:** Within 5 business days
- **Fix timeline:** Depends on severity, but critical issues are prioritized

We will keep you informed throughout the process and credit you when the fix is published (unless you prefer to remain anonymous).

## Scope

The following are **in scope** for security reports:

- Authentication bypass
- Remote code execution
- SQL injection (if applicable)
- Cross-site scripting (XSS)
- Server-side request forgery (SSRF)
- Path traversal
- Exposure of sensitive data

The following are **out of scope**:

- Rate limiting bypass (we have intentional limits)
- Missing security headers (we use Helmet with sensible defaults)
- Self-XSS
- Social engineering

## Responsible Disclosure

We kindly ask that you:

1. Allow us reasonable time to fix the issue before public disclosure
2. Do not exploit the vulnerability beyond what's necessary to demonstrate it
3. Do not access, modify, or delete data you don't own

## Recognition

We maintain a hall of fame for security researchers who report valid vulnerabilities. You'll be credited in our release notes (unless you prefer to remain anonymous).

Thank you for helping keep this project and its users safe.
