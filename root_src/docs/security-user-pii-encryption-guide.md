# User PII Encryption Guide

## Overview

Step-by-step guide for setting up and using the User PII Encryption system. This guide covers key generation, configuration, deployment, and troubleshooting.

---

## TL;DR

**Setup Steps**:

1. Generate RSA key pair
2. Configure environment variables
3. Run database migration
4. Start the application

**Key Commands**:

```bash
# Generate keys
openssl genrsa -aes256 -out private-key.pem 4096
openssl rsa -in private-key.pem -pubout -out public-key.pem

# Run migration
pnpm run db:migrate

# Test encryption
pnpm run test src/jobs/user-encryption/__tests__/
```

**Critical Rules**:

- Never commit private keys to version control
- Always backup keys before deployment
- Test with dry-run mode first

---

## Prerequisites

- Node.js v18+
- OpenSSL for key generation
- PostgreSQL database
- NestJS application running

---

## Step 1: Generate RSA Key Pair

### 1.1 Generate Private Key

```bash
openssl genrsa -aes256 -out private-key.pem 4096
```

You will be prompted for a passphrase. Use a strong passphrase (min 16 characters).

### 1.2 Extract Public Key

```bash
openssl rsa -in private-key.pem -pubout -out public-key.pem
```

### 1.3 Convert to JSON Format

Create `config/jwks/public-key.json`:

```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

Create `config/jwks/private-key.json`:

```json
{
  "privateKey": "-----BEGIN ENCRYPTED PRIVATE KEY-----\n...\n-----END ENCRYPTED PRIVATE KEY-----"
}
```

**Tip**: Use `cat private-key.pem | jq -Rs '{privateKey: .}'` to convert PEM to JSON.

---

## Step 2: Configure Environment

Add to your `.env` file:

```env
# Required
ENCRYPTION_PUBLIC_KEY_PATH=config/jwks/public-key.json
ENCRYPTION_PRIVATE_KEY_PATH=config/jwks/private-key.json
ENCRYPTION_KEY_PASSPHRASE=your-strong-passphrase-here

# Optional (with defaults)
ENCRYPTION_CRON_SCHEDULE=0 2 * * *
ENCRYPTION_BATCH_SIZE=100
ENCRYPTION_BATCH_DELAY_MS=1000
ENCRYPTION_MAX_RETRIES=3
ENCRYPTION_DRY_RUN=false
```

---

## Step 3: Run Database Migration

```bash
pnpm run db:migrate
```

This migration:

- Changes PII columns from VARCHAR to TEXT
- Adds `encryption_status` column
- Adds `encrypted_at` timestamp

### Verify Migration

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'core'
  AND table_name = 'users'
  AND column_name IN ('name', 'email', 'phone', 'provider', 'provider_id');
```

Expected: All columns should be `text` type.

---

## Step 4: Test Configuration

### 4.1 Run Unit Tests

```bash
pnpm run test src/jobs/user-encryption/__tests__/
```

Expected: All 156 tests pass.

### 4.2 Test Dry Run Mode

Set `ENCRYPTION_DRY_RUN=true` and trigger the job:

```bash
# In your application or via API
curl -X POST http://localhost:3004/admin/encryption/trigger
```

Check logs for:

```
[UserEncryptionJob] Dry run mode enabled - no database updates will be made
```

---

## Step 5: Deploy to Production

### 5.1 Pre-Deployment Checklist

- [ ] Keys generated and stored securely
- [ ] Environment variables configured
- [ ] Migration tested in staging
- [ ] Dry run completed successfully
- [ ] Key backup created
- [ ] Rollback plan prepared

### 5.2 Deployment Steps

1. Deploy application with new code
2. Run migration: `pnpm run db:migrate`
3. Verify cron job is scheduled
4. Monitor first job execution

### 5.3 Post-Deployment Verification

```sql
-- Check encryption progress
SELECT
  encryption_status,
  COUNT(*) as count
FROM core.users
GROUP BY encryption_status;
```

---

## Common Patterns

### Pattern 1: Manual Job Trigger

For immediate encryption (not waiting for cron):

```typescript
@Controller('admin/encryption')
export class EncryptionController {
  constructor(private readonly job: UserEncryptionJobService) {}

  @Post('trigger')
  async triggerJob() {
    return this.job.triggerJob();
  }
}
```

### Pattern 2: Decrypt for Display

```typescript
async getUserProfile(userId: number) {
  const user = await this.db.query()
    .from('core.users')
    .where('id', userId)
    .first();

  if (user.encryption_status === 'encrypted') {
    return {
      ...user,
      name: this.encryption.decryptFromString(user.name),
      email: this.encryption.decryptFromString(user.email),
      phone: user.phone ? this.encryption.decryptFromString(user.phone) : null,
    };
  }

  return user;
}
```

### Pattern 3: Search Encrypted Data

Since encrypted data cannot be searched directly, use email hash:

```typescript
// Store hash alongside encrypted email
const emailHash = crypto
  .createHash('sha256')
  .update(email.toLowerCase())
  .digest('hex');

// Search by hash
const user = await this.db
  .query()
  .from('core.users')
  .where('email_hash', emailHash)
  .first();
```

---

## Best Practices

### DO

- **Rotate keys periodically** - Re-encrypt with new keys annually
- **Monitor job execution** - Set up alerts for failures
- **Use transactions** - Ensure atomic updates
- **Log without PII** - Never log decrypted values
- **Test recovery** - Verify you can decrypt with backup keys

### DON'T

- **Skip validation** - Always validate keys on startup
- **Ignore failures** - Investigate all encryption failures
- **Store keys in DB** - Keep keys separate from encrypted data
- **Use weak passphrase** - Minimum 16 characters, mixed case, numbers, symbols
- **Deploy without backup** - Always have key recovery plan

---

## Troubleshooting

### Issue: "Encryption service not initialized"

**Cause**: Keys not loaded on startup.

**Solution**:

1. Check key file paths in environment
2. Verify files exist and are readable
3. Check passphrase is correct

### Issue: "Decryption failed"

**Cause**: Wrong keys or corrupted data.

**Solution**:

1. Verify using same key pair that encrypted data
2. Check data format is valid (4 dot-separated parts)
3. Ensure no data truncation occurred

### Issue: Job timeout

**Cause**: Too many users or slow database.

**Solution**:

1. Reduce batch size
2. Increase batch delay
3. Run during low-traffic hours

---

## Quick Reference

| Task           | Command/Action                                                                  |
| -------------- | ------------------------------------------------------------------------------- |
| Generate keys  | `openssl genrsa -aes256 -out private-key.pem 4096`                              |
| Run tests      | `pnpm run test src/jobs/user-encryption/__tests__/`                             |
| Run migration  | `pnpm run db:migrate`                                                           |
| Check progress | `SELECT encryption_status, COUNT(*) FROM core.users GROUP BY encryption_status` |
| Trigger job    | `POST /admin/encryption/trigger`                                                |

---

## Related Documentation

- [User PII Encryption Overview](security-user-pii-encryption-overview.md)
- [User PII Encryption Documentation](security-user-pii-encryption-documentation.md)
- [User PII Encryption Examples](security-user-pii-encryption-examples.md)

---

**Version**: 1.0.0
**Last Updated**: 2026-01-26
