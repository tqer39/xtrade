# Security Design

[Japanese](./security.ja.md)

This document describes the security design and policies of xtrade.

## Authentication Method

xtrade uses **X (Twitter) OAuth authentication**.

### Reasons for Selection

- Users can log in with existing X accounts (no new account creation required)
- Leverages X's security infrastructure (no password management required)
- Transparency in viewing trading partners' X profiles

## Access Control

### Whitelist Feature

Implements invitation-based access control.

| Feature | Description |
| --- | --- |
| Admin Configuration | Specified via `ADMIN_TWITTER_USERNAME` environment variable |
| Whitelist | Only X users approved by admin can log in |
| Admin Panel | Manage whitelist at `/admin/users` |

### Role-Based Access Control

| Role | Permissions |
| --- | --- |
| `admin` | All features + user management |
| `user` | General features only |

### BAN Feature

Administrators can BAN problematic users.

- `banned`: BAN status flag
- `banReason`: Reason for BAN
- `banExpires`: BAN expiration (null for permanent BAN)

## About MFA (Multi-Factor Authentication)

### Current Policy

MFA implementation is not performed on the xtrade side.

### Reasons

1. **Authentication Method Constraints**
   - With X OAuth authentication, MFA is handled by the provider (X)
   - BetterAuth's MFA plugin is for email/password authentication only

2. **Risk Level Assessment**
   - xtrade is an item trading platform, not financial transactions
   - Financial damage from account compromise is limited

3. **Existing Security Layers**
   - Whitelist feature makes it invitation-only (not accessible to general public)
   - Admin can manage users and BAN as needed
   - Response mechanisms are in place for incidents

4. **Balance with Usability**
   - Additional authentication steps can cause user drop-off
   - In the initial phase, "getting users to use it" is important

### About X's 2FA

X account 2FA (two-factor authentication) settings are the user's own responsibility.

- Forcing X phone number registration is not recommended
- Reason: Risk of user drop-off due to reduced usability outweighs security improvement benefits

### Future Considerations

Security enhancements will be considered if:

- High-value item trading increases
- Fraud reports increase
- User count grows significantly

Phased approach examples:

1. Require additional authentication only for high-value trades
2. Trade history monitoring and anomaly detection
3. Trust score-based access control

## Environment Variable Security

### Secret Management

| Environment Variable | Description | Storage Location |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Session encryption key | GitHub Secrets |
| `TWITTER_CLIENT_ID` | X OAuth client ID | GitHub Secrets |
| `TWITTER_CLIENT_SECRET` | X OAuth client secret | GitHub Secrets |
| `ADMIN_TWITTER_USERNAME` | Admin username | GitHub Secrets |
| `DATABASE_URL` | DB connection string | GitHub Secrets / Terraform |

### Notes

- `.env.local` is excluded from Git (included in `.gitignore`)
- Do not hardcode production secrets in code
- Do not commit `ADMIN_TWITTER_USERNAME` to public repository

## CSRF Protection

BetterAuth's `trustedOrigins` setting accepts requests only from allowed origins.

```typescript
trustedOrigins: [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  'https://xtrade-dev.tqer39.dev',
  'https://xtrade.tqer39.dev',
  'http://localhost:3000',
]
```

Vercel preview URLs (`*.vercel.app`) are dynamically allowed.

## Session Management

| Setting | Value | Description |
| --- | --- | --- |
| `expiresIn` | 7 days | Session expiration |
| `updateAge` | 1 day | Session update interval |
| `cookieCache.maxAge` | 5 minutes | Cookie cache time |

## Incident Response

### User Account Compromise

1. BAN the user from admin panel
2. Remove from whitelist if necessary
3. Review and address related trades

### Admin Account Compromise

1. Change `ADMIN_TWITTER_USERNAME`
2. Update environment variables via Terraform apply
3. Redeploy Vercel

## Related Documentation

- [GitHub Secrets Configuration](./github-secrets.md)
- [Local Development Environment](./local-dev.md)
- [Terraform Environment Variables](./terraform-environment-variables.md)
