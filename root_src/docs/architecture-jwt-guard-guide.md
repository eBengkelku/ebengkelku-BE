# JWT Authentication Guard Guide

## 🔐 Guard Architecture

### JwtAuthGuard

**File**: `src/auth/jwt.guard.ts`

**Responsibilities**:

- ✅ Verify JWT token signature using JWKS
- ✅ Validate token claims (issuer, audience, expiry)
- ✅ Extract AccessUser payload from token
- ✅ Attach `AccessUser` to `req.user`
- ✅ Add JWT verification metrics to `req.auth_metrics`
- ✅ Support `@Public()` decorator to bypass authentication

**Output**:

```typescript
req.user = {
  sub: string;              // User ID from Keycloak
  email?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  // ... other JWT claims
}

req.auth_metrics = {
  verify_duration_ms: number;
}
```

---

## 🎯 Current Implementation

### Global Authentication (Default)

All routes are automatically protected by JWT authentication via `APP_GUARD`:

```typescript
// src/app.module.ts
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

**Mark public routes with @Public():**

```typescript
// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Usage in controllers:**

```typescript
import { Public } from '@/common/decorators/public.decorator';

@Controller()
export class AppController {
  @Get('health')
  @Public() // ← Bypasses JWT authentication
  getHealth() {
    return { status: 'ok' };
  }

  @Get('me')
  // ← Automatically protected by JWT guard
  getCurrentUser(@CurrentUser() user: AccessUser) {
    return { success: true, data: { user } };
  }
}
```

**Guard behavior with @Public():**

- `JwtAuthGuard` checks for `@Public()` decorator using Reflector
- If `@Public()` is present, guard returns `true` immediately
- If not present, normal JWT authentication flow executes

---

---

## 🔄 Request Flow

### With JwtAuthGuard:

```
1. Request arrives
   └─> Authorization: Bearer <token>
   └─> x-lang: en (optional)

2. JwtAuthGuard executes
   ├─> Check @Public() decorator
   │   ├─> If present: return true (bypass auth)
   │   └─> If not: continue authentication
   ├─> Verify Authorization header exists
   ├─> Extract JWT token from Bearer header
   ├─> Verify JWT signature using JWKS
   ├─> Validate claims (issuer, audience, expiry)
   └─> Set req.user = AccessUser (JWT payload)
       └─> req.auth_metrics = { verify_duration_ms }

3. Controller executes
   └─> Access request.user (AccessUser)
```

---

## 🎨 Decorator Usage

### CurrentUser Decorator:

```typescript
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccessUser } from '@/auth/auth.service';

@Get('me')
async getCurrentUser(@CurrentUser() user: AccessUser) {
  return { user };
}
```

---

## ⚠️ Important Notes

### 1. **Environment Variables Required**

JwtAuthGuard requires these environment variables:

```bash
ISSUER=https://your-keycloak-server/realms/your-realm
AUDIENCE=your-client-id
```

### 2. **Error Handling**

JwtAuthGuard throws `UnauthorizedException` on failure:

- Missing Authorization header
- Malformed Authorization header (not Bearer token)
- Invalid JWT signature
- Expired JWT token
- Invalid issuer or audience

### 3. **Internationalization Support**

Error messages support i18n via `x-lang` header:

```typescript
// Request headers
{
  "Authorization": "Bearer <token>",
  "x-lang": "en" // or "id"
}
```

### 4. **Metrics Access**

```typescript
@Get('protected')
getProtected(@Req() req: Request) {
  const metrics = req.auth_metrics;
  console.log('JWT verification:', metrics.verify_duration_ms, 'ms');
}
```

---

## 🧪 Testing

### Test JwtAuthGuard:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../jwt.guard';

const mockAuthService = {
  verifyAccessToken: jest.fn().mockResolvedValue({
    sub: 'user-123',
    email: 'test@example.com',
    preferred_username: 'testuser',
  }),
};

const mockI18nService = {
  t: jest.fn().mockReturnValue('Token is required'),
};

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    JwtAuthGuard,
    { provide: AuthService, useValue: mockAuthService },
    { provide: I18nService, useValue: mockI18nService },
    { provide: Reflector, useValue: mockReflector },
  ],
}).compile();
```

---

## 🚀 Current Implementation Examples

### Protected Routes (Default)

All routes are automatically protected:

```typescript
@Controller('v1/auth')
export class AuthController {
  @Get('me')
  // ← Automatically protected by JwtAuthGuard
  getCurrentUser(@CurrentUser() user: AccessUser) {
    return { success: true, data: { user } };
  }
}
```

### Public Routes

Use `@Public()` decorator to bypass authentication:

```typescript
@Controller()
export class AppController {
  @Get('health')
  @Public() // ← Bypasses JWT authentication
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

---

## ✅ Benefits

1. **Security by Default**: All routes protected unless explicitly marked public
2. **Simple Usage**: Just use `@CurrentUser()` decorator to access user data
3. **Performance**: JWT verification with caching and metrics
4. **Flexibility**: Easy to mark routes as public with `@Public()` decorator
5. **I18n Support**: Error messages support multiple languages
6. **Testing**: Easy to mock and test guard behavior

---

## 🎨 Decorator Usage

### With JWT Only:

```typescript
@CurrentUser() user: AccessUser
```

````

TypeScript will infer the correct type based on guards used.

---

## ⚠️ Important Notes

### 1. **Guard Order Matters**

```typescript
// ✅ CORRECT
@UseGuards(JwtAuthGuard, AuthGuard)

// ❌ WRONG - AuthGuard needs req.user from JwtAuthGuard
@UseGuards(AuthGuard, JwtAuthGuard)
````

### 2. **AuthGuard Dependencies**

AuthGuard requires:

- `req.user` to be set (by JwtAuthGuard)
- `req.user.sub` to exist (JWT subject = user public_id)

### 3. **Error Handling**

Both guards throw `UnauthorizedException` on failure:

- JwtAuthGuard: Token invalid/expired/missing
- AuthGuard: User validation/sync failed

### 4. **Metrics Access**

```typescript
@Get('protected')
@UseGuards(JwtAuthGuard, AuthGuard)
getProtected(@Req() req: Request) {
  const metrics = req.auth_metrics;
  console.log('JWT verification:', metrics.verify_duration_ms, 'ms');
  console.log('User validation:', metrics.validation_duration_ms, 'ms');
  console.log('Cache hit:', metrics.cache_hit);
  console.log('New user:', metrics.is_new_user);
}
```

---

## 🧪 Testing

### Test JwtAuthGuard:

```typescript
const mockAuthService = {
  verifyAccessToken: jest.fn().mockResolvedValue({
    sub: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
  }),
};

const module = await Test.createTestingModule({
  providers: [
    JwtAuthGuard,
    { provide: AuthService, useValue: mockAuthService },
    { provide: I18nService, useValue: mockI18nService },
  ],
}).compile();
```

### Test AuthGuard:

```typescript
const mockAuthService = {
  validateCurrentUser: jest.fn().mockResolvedValue({
    success: true,
    data: {
      user: mockUserEntity,
      cache_hit: false,
      is_new_user: false,
    },
  }),
};

const module = await Test.createTestingModule({
  providers: [
    AuthGuard,
    { provide: AuthService, useValue: mockAuthService },
    { provide: I18nService, useValue: mockI18nService },
  ],
}).compile();
```

---

## 🚀 Current Implementation

### Global Guards (Default)

All routes are automatically protected by both guards:

```typescript
@Controller('users')
export class UsersController {
  @Get('me')
  // ← Automatically protected by JwtAuthGuard + AuthGuard
  getCurrentUser(@CurrentUser() user: UserModel) {
    return user; // UserModel from database
  }
}
```

### Public Routes

Use `@Public()` decorator to bypass authentication:

```typescript
@Controller('public')
export class PublicController {
  @Get('info')
  @Public() // ← Bypasses all guards
  getPublicInfo() {
    return { version: '1.0.0' };
  }
}
```

### Manual Guard Override (Not Recommended)

If needed, you can override global guards:

```typescript
@Controller('special')
@UseGuards() // ← Clears global guards
export class SpecialController {
  @Get('jwt-only')
  @UseGuards(JwtAuthGuard) // ← Only JWT verification
  getJwtOnly(@CurrentUser() user: AccessUser) {
    return user; // AccessUser from JWT
  }
}
```

---

## ✅ Benefits of Separation

1. **Flexibility**: Choose JWT-only or JWT+DB based on needs
2. **Performance**: Skip DB sync when not needed
3. **Testing**: Easier to test each guard independently
4. **Clarity**: Clear responsibility boundaries
5. **Reusability**: Use JwtAuthGuard for public APIs, both for authenticated APIs

---
