<div align="center">

# 🛡️ Security at vyon

### Good music deserves a safer experience.

**Your trust matters. So does the way we protect it.**  
This page explains how to report vulnerabilities responsibly, what we maintain, and how we handle security concerns.

[![Security Policy](https://img.shields.io/badge/SECURITY-POLICY-c44759?style=for-the-badge&labelColor=161616&logo=github&logoColor=white)](https://github.com/bxanedot/vyon/security)
[![Responsible Disclosure](https://img.shields.io/badge/RESPONSIBLE-DISCLOSURE-333333?style=for-the-badge&labelColor=161616)](#-report-a-vulnerability)
[![Open Source](https://img.shields.io/badge/OPEN-SOURCE-333333?style=for-the-badge&labelColor=161616&logo=opensourceinitiative&logoColor=white)](LICENSE)

[**🎧 vyon.live**](https://vyon.live) · [**⬇️ Official releases**](https://github.com/bxanedot/vyon/releases) · [**💻 Source code**](https://github.com/bxanedot/vyon)

</div>

---

## 🚨 Report a vulnerability

> [!IMPORTANT]
> **Found a possible security issue? Please report it privately first.**  
> Do **not** publish exploitable details, proof-of-concept exploits, credentials, or private user data in public GitHub issues, pull requests, discussions, or social media.

### Where to report

1. **Preferred — GitHub private vulnerability reporting:** If enabled for this repository, use **[Report a vulnerability →](https://github.com/bxanedot/vyon/security/advisories/new)**. This is the preferred way to share details privately with maintainers.
2. **If that option is unavailable:** Check the [maintainer's GitHub profile](https://github.com/bxanedot) for an appropriate private contact method. If you cannot find one, you may [open a new issue](https://github.com/bxanedot/vyon/issues/new) **only to request a private reporting channel**—do not include vulnerability details or evidence in that public issue.

### What to include

Clear reports help us understand the impact and investigate safely:

| Detail | Helpful information |
| :-- | :-- |
| **Affected area** | Android, desktop, TV, Wear OS, website, shared core, or Listen Together |
| **Version** | Release version, commit SHA, and affected OS/device where relevant |
| **Impact** | What an attacker could do, what data or capability is at risk |
| **Reproduction** | Minimal steps or a safe proof of concept using your own test setup |
| **Evidence** | Redacted logs, screenshots, relevant code paths, or error messages |
| **Mitigation** | Any workaround or potential fix you have identified |

Please **remove passwords, tokens, cookies, API keys, personal information, and other secrets** from reports. Do not send real users' data.

---

## 📦 Supported versions

We focus security maintenance on the current codebase and the most recent published builds.

| Version / channel | Security maintenance |
| :-- | :-- |
| **Latest published release** | ✅ Priority for security fixes, when releases are available |
| **`main` branch** | 🧪 Active development; fixes may land here before a release |
| **Older releases / builds** | ⚠️ Best effort; backports are not guaranteed |
| **Unofficial forks / modified distributions** | ➖ Maintained by their respective distributors |

**Recommendation:** Use the latest official release from [GitHub Releases](https://github.com/bxanedot/vyon/releases). Development builds can contain unfinished changes; availability of source code does not mean every platform has a published installer.

---

## 🎯 What's in scope?

Vyon spans several platforms and services. Security reports are welcome for vulnerabilities in **code or infrastructure controlled by this project**, including:

| Component | Examples of relevant issues |
| :-- | :-- |
| **Android / Android TV / Wear OS** | Unsafe exported components, unintended data exposure, insecure local storage |
| **Desktop (Windows, macOS, Linux)** | Unsafe file handling, privilege boundaries, command execution, insecure updates |
| **Shared core & integrations** | Sensitive data leakage, token handling, untrusted content processing |
| **[vyon.live](https://vyon.live) website** | Project-owned website vulnerabilities such as cross-site scripting or exposed secrets |
| **Listen Together services** | Unauthorized room access, authentication/authorization flaws, abuse of room state or APIs |
| **Build & release pipeline** | Project-controlled packaging or distribution flaws that could compromise users |

### Usually out of scope

- Routine feature bugs, styling problems, or ordinary crashes **without a security impact** — please use [GitHub Issues](https://github.com/bxanedot/vyon/issues).
- Vulnerabilities exclusively in **YouTube, YouTube Music, Google, Discord, Last.fm, or other third-party services**. Report those to the relevant provider.
- Issues in unofficial builds, forks, or third-party deployments that cannot be reproduced in Vyon's maintained code.
- Reports based only on an automated scan without a verifiable security impact.

If an upstream dependency creates a **real security risk for Vyon users**, please still let us know privately.

---

## 🤝 Responsible research

We appreciate security researchers who help improve Vyon while keeping users safe.

**Please do:**
- Test with accounts, devices, files, rooms, and servers you own or are authorized to use.
- Keep tests proportional and non-disruptive; stop once you have enough evidence.
- Give maintainers a reasonable opportunity to investigate and coordinate a fix before public disclosure.
- Respect privacy and promptly stop testing if you encounter data that isn't yours.

**Please don't:**
- Access, copy, change, or disclose someone else's data.
- Run denial-of-service tests, spam services, perform social engineering, or disrupt real users.
- Attempt persistence, lateral movement, destructive exploits, or attacks on third-party systems.
- Publicly post a working exploit before coordinating disclosure.

This guidance welcomes **good-faith, authorized research**; it is not permission to test systems or accounts you don't control.

---

## 🔍 What happens after a report?

```text
Private report
     ↓
Review & reproduce
     ↓
Assess severity and impact
     ↓
Develop & validate a fix
     ↓
Release / advisory when appropriate
```

We aim to acknowledge useful reports, investigate credible findings, and prioritize fixes by actual risk. **Response times, release dates, and backports are not guaranteed.** We may ask for more details if we cannot reproduce a report.

When appropriate, we will coordinate public disclosure after users have a reasonable opportunity to update. Please avoid publishing sensitive technical details until that coordination has taken place.

### Credit & recognition

If you would like to be credited for a verified, responsibly disclosed finding, mention the name or handle you want us to use in your private report. Recognition is subject to your consent and the circumstances of the report. **Rewards or bounties are not promised.**

---

## 🔐 Staying safer with Vyon

A few habits make a real difference:

- **Download from trusted sources.** Prefer [official GitHub Releases](https://github.com/bxanedot/vyon/releases) and links from [vyon.live](https://vyon.live).
- **Keep Vyon and your operating system updated.** Security fixes may require installing a newer version.
- **Protect your credentials.** Never post API keys, tokens, session cookies, configuration secrets, or signing keys in an issue or screenshot.
- **Be careful with custom integrations and servers.** Only connect to services and music sources you trust.
- **Act on suspected compromise.** Stop using the affected integration, revoke exposed credentials with their provider, and submit a private report if you believe Vyon contributed to the exposure.

> [!NOTE]
> Vyon is an independent, open-source music player. It is **not affiliated with or endorsed by Google or YouTube**. The security of third-party platforms and services is governed by their own policies.

---

<div align="center">

### 🖤 Thanks for helping keep the music safe.

**Security is a shared effort. Every responsible report helps.**

[![Report privately](https://img.shields.io/badge/PRIVATE%20SECURITY%20REPORT-%E2%86%92-c44759?style=for-the-badge&labelColor=161616)](https://github.com/bxanedot/vyon/security/advisories/new)
[![Regular bug?](https://img.shields.io/badge/REGULAR%20BUG%3F-GITHUB%20ISSUES-333333?style=for-the-badge&labelColor=161616)](https://github.com/bxanedot/vyon/issues)

<sub>Made with ♥ by <a href="https://github.com/bxanedot">bxane</a> · <a href="https://vyon.live">vyon.live</a></sub>

</div>
