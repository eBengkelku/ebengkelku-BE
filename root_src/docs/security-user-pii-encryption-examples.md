# User PII Encryption Examples

## Overview

Code examples and use cases for the User PII Encryption system. This document provides practical examples for common encryption scenarios.

---

## TL;DR

**Examples Covered**:

1. Basic encryption/decryption
2. Batch user encryption
3. Decrypting user profile
4. Handling nullable fields
5. Error handling
6. Testing patterns

---

## Example 1: Basic Encryption and Decryption

### Use Case

Encrypt and decrypt a single string value.

### Code

```typescript
import { EncryptionService } from './services/encryption.service';

// Inject service
constructor(private readonly encryption: EncryptionService) {}

// Encrypt
const email = 'user@example.com';
const encrypted = this.encryption.encryptToString(email);
// Output: "YWJjZGVm...==.MTIzNDU2...==.dGFnMTIz...==.Y2lwaGVy...=="

// Decrypt
const decrypted = this.encryption.decryptFromString(encrypted);
// Output: "user@example.com"
```

### Explanation

- `encryptToString()` returns a dot-delimited Base64 string
- `decryptFromString()` reverses the process
- Each encryption produces unique output (different IV and AES key)

---

## Example 2: Encrypt User Object

### Use Case

Encrypt all PII fields for a user.

### Code

```typescript
interface UserPii {
  name: string | null;
  email: string;
  phone: string | null;
  provider: string | null;
  provider_id: string | null;
}

function encryptUserPii(user: UserPii): Record<string, string | null> {
  return {
    name: user.name ? this.encryption.encryptToString(user.name) : null,
    email: this.encryption.encryptToString(user.email),
    phone: user.phone ? this.encryption.encryptToString(user.phone) : null,
    provider: user.provider
      ? this.encryption.encryptToString(user.provider)
      : null,
    provider_id: user.provider_id
      ? this.encryption.encryptToString(user.provider_id)
      : null,
  };
}

// Usage
const user = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+6281234567890',
  provider: 'google',
  provider_id: '123456789',
};

const encrypted = encryptUserPii(user);
```

### Output

```json
{
  "name": "YWJj...==.MTIz...==.dGFn...==.Y2lw...==",
  "email": "ZGVm...==.NDU2...==.MTIz...==.aGVs...==",
  "phone": "Z2hp...==.Nzg5...==.YWJj...==.d29y...==",
  "provider": "amts...==.bG1u...==.b3Bx...==.cnN0...==",
  "provider_id": "dXZ3...==.eHl6...==.MTIz...==.NDU2...=="
}
```

---

## Example 3: Decrypt User Profile for Display

### Use Case

Retrieve encrypted user from database and decrypt for API response.

### Code

```typescript
async getUserProfile(userId: number): Promise<UserProfile> {
  const user = await this.db.query()
    .from('core.users')
    .where('id', userId)
    .first();

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Check if data is encrypted
  if (user.encryption_status === 'encrypted') {
    return {
      id: user.id,
      name: user.name
        ? this.encryption.decryptFromString(user.name)
        : null,
      email: this.encryption.decryptFromString(user.email),
      phone: user.phone
        ? this.encryption.decryptFromString(user.phone)
        : null,
      // Don't expose provider details to client
      createdAt: user.created_at,
    };
  }

  // Return unencrypted data as-is
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.created_at,
  };
}
```

### Explanation

- Always check `encryption_status` before decrypting
- Handle nullable fields with conditional decryption
- Consider which fields to expose to clients

---

## Example 4: Batch Processing with Progress

### Use Case

Encrypt users in batches with progress tracking.

### Code

```typescript
async encryptUsersWithProgress(
  onProgress?: (current: number, total: number) => void,
): Promise<BatchResult> {
  const totalPending = await this.getPendingCount();
  let processed = 0;
  let successCount = 0;
  let failureCount = 0;

  while (processed < totalPending) {
    const users = await this.fetchPendingUsers(100, processed);

    if (users.length === 0) break;

    for (const user of users) {
      try {
        const encrypted = this.encryptUserPii(user);
        await this.updateUser(user.id, encrypted);
        successCount++;
      } catch (error) {
        failureCount++;
        this.logger.error(`Failed to encrypt user ${user.id}`, error);
      }

      processed++;
      onProgress?.(processed, totalPending);
    }

    // Delay between batches
    await this.delay(1000);
  }

  return { totalPending, successCount, failureCount };
}

// Usage with progress callback
await encryptUsersWithProgress((current, total) => {
  console.log(`Progress: ${current}/${total} (${Math.round(current/total*100)}%)`);
});
```

---

## Example 5: Error Handling

### Use Case

Handle encryption and decryption errors gracefully.

### Code

```typescript
function safeDecrypt(
  encrypted: string | null,
  fieldName: string,
): string | null {
  if (!encrypted) return null;

  try {
    return this.encryption.decryptFromString(encrypted);
  } catch (error) {
    this.logger.error({
      message: 'Decryption failed',
      field: fieldName,
      error: error.message,
      // Never log the encrypted value in production
    });

    // Return masked value or throw based on business rules
    return '[DECRYPTION_ERROR]';
  }
}

function safeEncrypt(
  plaintext: string | null,
  fieldName: string,
): string | null {
  if (!plaintext) return null;

  try {
    return this.encryption.encryptToString(plaintext);
  } catch (error) {
    this.logger.error({
      message: 'Encryption failed',
      field: fieldName,
      error: error.message,
    });

    throw new InternalServerErrorException(`Failed to encrypt ${fieldName}`);
  }
}
```

---

## Example 6: Testing Encryption

### Use Case

Unit test encryption functionality.

### Code

```typescript
describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    // Setup test module with real or mock keys
    const module = await Test.createTestingModule({
      providers: [
        EncryptionService,
        // ... providers
      ],
    }).compile();

    service = module.get(EncryptionService);
    await service.onModuleInit();
  });

  describe('encryptToString', () => {
    it('should encrypt and produce valid format', () => {
      const encrypted = service.encryptToString('test@example.com');

      expect(typeof encrypted).toBe('string');
      expect(encrypted.split('.')).toHaveLength(4);
    });

    it('should produce unique output for same input', () => {
      const encrypted1 = service.encryptToString('test');
      const encrypted2 = service.encryptToString('test');

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('round-trip encryption', () => {
    it('should decrypt to original value', () => {
      const original = 'sensitive-data@example.com';
      const encrypted = service.encryptToString(original);
      const decrypted = service.decryptFromString(encrypted);

      expect(decrypted).toBe(original);
    });

    it('should handle Unicode characters', () => {
      const original = 'Muhammad Rizky Wijaya';
      const encrypted = service.encryptToString(original);
      const decrypted = service.decryptFromString(encrypted);

      expect(decrypted).toBe(original);
    });
  });
});
```

---

## Example 7: Database Transaction

### Use Case

Update encrypted user data in a transaction.

### Code

```typescript
async updateUserWithEncryption(
  userId: number,
  updates: Partial<UserPii>,
): Promise<void> {
  await this.db.transaction(async (trx) => {
    // Fetch current user
    const user = await trx('core.users')
      .where('id', userId)
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare encrypted updates
    const encryptedUpdates: Record<string, string | null> = {};

    if (updates.email) {
      encryptedUpdates.email = this.encryption.encryptToString(updates.email);
    }
    if (updates.name !== undefined) {
      encryptedUpdates.name = updates.name
        ? this.encryption.encryptToString(updates.name)
        : null;
    }
    if (updates.phone !== undefined) {
      encryptedUpdates.phone = updates.phone
        ? this.encryption.encryptToString(updates.phone)
        : null;
    }

    // Update user
    await trx('core.users')
      .where('id', userId)
      .update({
        ...encryptedUpdates,
        encryption_status: 'encrypted',
        encrypted_at: new Date(),
        updated_at: new Date(),
      });
  });
}
```

---

## Comparison Table

| Scenario          | Method              | Notes                  |
| ----------------- | ------------------- | ---------------------- |
| Single value      | `encryptToString()` | Simple, returns string |
| Object with nulls | Custom wrapper      | Handle nullable fields |
| Batch processing  | `encryptBatch()`    | Use job service        |
| With transaction  | `db.transaction()`  | Ensure atomicity       |
| Error handling    | try/catch wrapper   | Log without PII        |

---

## Related Documentation

- [User PII Encryption Overview](security-user-pii-encryption-overview.md)
- [User PII Encryption Documentation](security-user-pii-encryption-documentation.md)
- [User PII Encryption Guide](security-user-pii-encryption-guide.md)

---

**Version**: 1.0.0
**Last Updated**: 2026-01-26
