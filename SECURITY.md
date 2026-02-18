# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.0.4   | Yes       |
| < 0.0.4 | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in Steadi, please report it responsibly.

**Email**: [siddharth@khattar.dev](mailto:siddharth@khattar.dev)

Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgement** within 48 hours of your report.
- **Status update** within 7 days with an assessment and remediation timeline.
- **Credit** in the release notes (unless you prefer to remain anonymous).

### Safe Harbor

We consider security research conducted in good faith to be authorized. We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction, or service disruption
- Report vulnerabilities promptly and provide sufficient detail to reproduce the issue
- Do not publicly disclose the vulnerability before a fix is available

## Scope

Steadi runs entirely on-device with zero network calls. The primary security surface areas are:

- **Filesystem access**: script storage and settings persistence
- **IPC between windows**: Tauri event system and invoke commands
- **Capability scoping**: per-window Tauri permissions
- **Native API usage**: `objc2` on macOS, Windows API calls
