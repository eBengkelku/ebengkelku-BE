# User PII Encryption Overview

## Overview

The User PII Encryption system provides automatic encryption of Personally Identifiable Information (PII) in the `core.users` table to comply with Indonesia's Personal Data Protection Law (UU PDP). It uses hybrid encryption (RSA-4096 + AES-256-GCM) to secure sensitive user data including name, email, phone, provider, and provider_id fields.

---

## TL;DR

- **What**: Automatic batch encryption of user PII data using hybrid RSA + AES encryption
- **Why**: Compliance with Indonesia's UU PDP (Personal Data Protection Law)
- **When to use**: When storing sensitive user data that requires encryption at rest
- **When NOT to use**: For data that needs to be searchable or indexed
- **Key feature**: Cron job automatically encrypts unencrypted users in batches

---

## What Is User PII Encryption?

User PII Encryption is a security feature that protects sensitive user information by encrypting it directly in the database. The system uses a hybrid encryption approach:

1. **AES-256-GCM** encrypts the actual data (fast, symmetric encryption)
2. **RSA-4096** encrypts the AES key (secure key exchange)

This combination provides both security and performance - RSA handles key security while AES handles bulk data encryption efficiently.

### Protected Fields

| Field         | Description                       | Required      |
| ------------- | --------------------------------- | ------------- |
| `name`        | User's full name                  | No (nullable) |
| `email`       | User's email address              | Yes           |
| `phone`       | User's phone number               | No (nullable) |
| `provider`    | OAuth provider (google, facebook) | No (nullable) |
| `provider_id` | OAuth provider user ID            | No (nullable) |

---

## Why Use User PII Encryption?

### Compliance Requirements

Indonesia's UU PDP (Law No. 27/2022) mandates:

- Protection of personal data through technical measures
- Encryption of sensitive data at rest
- Audit trails for data access

### Security Benefits

- **Data Protection**: Even if database is compromised, PII remains encrypted
- **Key Separation**: Private key stored separately from encrypted data
- **Authenticated Encryption**: AES-GCM provides integrity verification
- **Unique Keys**: Each encryption uses unique AES key and IV

### Business Value

- Regulatory compliance (avoid penalties up to 2% of annual revenue)
- Customer trust through data protection
- Reduced data breach impact

---

## Key Concepts

### 1. Hybrid Encryption

```
Plaintext -> AES-256-GCM (with random key) -> Ciphertext
Random AES Key -> RSA-4096 (public key) -> Encrypted Key
```

Decryption reverses this process using the RSA private key.

### 2. Serialized Format

Encrypted data is stored as a dot-delimited string:

```
{encryptedKey}.{iv}.{tag}.{ciphertext}
```

All components are Base64 encoded.

### 3. Batch Processing

The cron job processes users in configurable batches:

- Default batch size: 100 users
- Configurable delay between batches
- Automatic retry on failure (3 attempts)

---

## How It Works

```
+----------------+     +------------------+     +----------------+
|  Cron Job      | --> |  Encryption      | --> |  Database      |
|  (Scheduler)   |     |  Service         |     |  Update        |
+----------------+     +------------------+     +----------------+
        |                      |                       |
        v                      v                       v
  Fetch pending         Encrypt each           Store encrypted
  users (batch)         PII field              data in columns
```

1. Cron job triggers at configured schedule (default: daily at 2 AM)
2. Fetches users where `encryption_status != 'encrypted'`
3. For each user, encrypts all PII fields
4. Updates the original columns with encrypted values
5. Sets `encryption_status = 'encrypted'`

---

## When To Use

### Use When

- Storing user personal data (names, emails, phones)
- Compliance with data protection regulations is required
- Data at rest protection is needed
- You have proper key management infrastructure

### Don't Use When

- Data needs to be searchable (use hashing for lookups instead)
- Real-time decryption performance is critical
- Key management infrastructure is not available
- Data is already protected by other means (e.g., column-level DB encryption)

---

## Getting Started

1. **Quickstart**: See `security-user-pii-encryption-guide.md` for setup
2. **Full Documentation**: See `security-user-pii-encryption-documentation.md`
3. **Code Examples**: See `security-user-pii-encryption-examples.md`

---

## Related Documentation

- [User PII Encryption Documentation](security-user-pii-encryption-documentation.md)
- [User PII Encryption Guide](security-user-pii-encryption-guide.md)
- [User PII Encryption Examples](security-user-pii-encryption-examples.md)

---

**Version**: 1.0.0
**Last Updated**: 2026-01-26
