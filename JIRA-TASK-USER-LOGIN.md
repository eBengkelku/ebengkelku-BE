# JIRA Task: User Login API Endpoint with JWT Authentication

## Task Name

Implement User Login Endpoint with Email/Password Authentication and JWT Token Generation

---

## User Story

**As a** registered user of eBengkelku  
**I want to** login to my account using my email and password  
**So that** I can receive an access token to authenticate my requests and access platform services

---

## Description

Create a new API endpoint at `/v1/auth/login` that allows registered users to authenticate using their email and password credentials. The endpoint should validate credentials against encrypted database records, verify account status, and return a JWT access token upon successful authentication. The implementation must utilize the existing JWT library (RS256 algorithm with private key signing) and encryption service to securely handle user data.

---

## Acceptance Criteria

### Functional Requirements

1. The endpoint must accept POST requests at `/v1/auth/login`
2. The endpoint must require email and password as mandatory fields
3. The endpoint must trim whitespace from email input
4. The endpoint must perform case-insensitive email matching (convert to lowercase)
5. The endpoint must decrypt user data from database before password verification
6. The endpoint must verify password hash using bcrypt.compare
7. The endpoint must check if the user account is deleted (deleted_at IS NOT NULL) and return generic error if true
8. The endpoint must check if email is verified (email_verified_at IS NOT NULL) and return specific error if false
9. The endpoint must retrieve user's public_id from core.users table for JWT generation
10. The endpoint must generate JWT access token using existing JwtService.generateAccessToken method
11. The endpoint must return HTTP 200 status code on successful login
12. The endpoint must return access_token, type ("Bearer"), and expiration_time in the response
13. The endpoint must return HTTP 401 for invalid credentials
14. The endpoint must return HTTP 403 for unverified email accounts
15. The endpoint must return generic "Invalid credentials" message for both non-existent email and wrong password to prevent user enumeration attacks

### Technical Requirements

1. Use the existing domain model pattern for implementation
2. Follow the standardized response format as per project documentation
3. Implement proper error handling with domain error codes
4. Use existing JwtService from libs/jwt for token generation
5. Use existing encryption service to decrypt user PII data before password comparison
6. Follow the existing auto-crud pattern if applicable
7. Implement proper validation using DTOs (Data Transfer Objects)
8. Use existing i18n pattern for error messages
9. Follow the Laravel-inspired pattern for repository implementation
10. Ensure proper logging for audit trail (successful logins and failed attempts)

### Security Requirements

1. Password verification must use bcrypt.compare with stored hash
2. Never log plain text passwords in any circumstance
3. Return generic error message for failed authentication to prevent user enumeration
4. Email must be sanitized to prevent SQL injection
5. Input validation must prevent XSS attacks
6. Encrypted fields must be decrypted using the configured encryption service before password comparison
7. Failed login attempts should be logged for security monitoring (log only, no lockout in this phase)
8. Account lockout and rate limiting are out of scope for this phase

### JWT Token Requirements

1. Use existing JwtService.generateAccessToken(publicId) method
2. JWT algorithm: RS256 (configured in existing service)
3. JWT token type: Bearer (configured in existing service)
4. Token expiration controlled by JWT_EXPIRED_TIME environment variable
5. JWT payload must include (as per existing implementation):
   - exp: Expiration timestamp
   - iat: Issued at timestamp
   - auth_time: Authentication time timestamp
   - jti: JWT ID (unique identifier)
   - sub: User's public_id
   - typ: "Bearer"
   - roles: User's role ID
   - permissions: Array of permission keys
   - name: User's decrypted name
   - email: User's decrypted email

---

## Expected Request Body

### Required Fields

- **email**: string, valid email format, 1-255 characters, must exist in database
- **password**: string, minimum 1 character, must match the hashed password in database

### Request Body Example Structure

The request body should contain the following fields with their respective validation rules:

- email field must not be empty and should be in valid email format
- password field must not be empty
- email will be trimmed and converted to lowercase before lookup
- password will be verified against bcrypt hash stored in database

---

## Expected Response Body (Data Part)

### Success Response (HTTP 200)

The data object should include the following fields:

- **access_token**: string, the JWT token signed with RS256 algorithm
- **type**: string, always "Bearer"
- **expiration_time**: number, token expiration time in milliseconds from the JWT_EXPIRED_TIME environment variable

### Success Response Example Structure (for data part)

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "expiration_time": 300000
}
```

Note: The response must NOT include the user object, password, or any other sensitive information beyond the token details.

---

## Unit Test Cases - Success Scenarios

### Basic Login Tests

1. **Test successful login with valid email and password**: Verify that user receives HTTP 200 with access token, type, and expiration time
2. **Test successful login returns valid JWT token structure**: Verify token is a properly formatted JWT string with three parts separated by dots
3. **Test successful login with email containing uppercase letters**: Verify case-insensitive email matching works correctly
4. **Test successful login with email containing leading/trailing spaces**: Verify trimming works and login succeeds
5. **Test successful login with email containing mixed case and spaces**: Verify both trimming and lowercase conversion work together

### Token Generation Tests

6. **Test that access_token is generated using JwtService**: Verify JwtService.generateAccessToken is called with correct public_id
7. **Test that JWT payload contains correct user public_id as sub claim**: Verify decoded token has sub matching user's public_id
8. **Test that JWT payload contains user roles**: Verify decoded token includes roles claim
9. **Test that JWT payload contains user permissions**: Verify decoded token includes permissions array
10. **Test that JWT payload contains decrypted user name**: Verify decoded token includes correct decrypted name
11. **Test that JWT payload contains decrypted user email**: Verify decoded token includes correct decrypted email
12. **Test that JWT token type is Bearer**: Verify response data.type equals "Bearer"
13. **Test that expiration_time matches JWT_EXPIRED_TIME from env**: Verify response data.expiration_time matches configured value

### Data Decryption Tests

14. **Test that encrypted user data is decrypted before password comparison**: Verify encryption service is called for users with is_encrypted = true
15. **Test successful login for user with encrypted email**: Verify email decryption works correctly
16. **Test successful login for user with encrypted name**: Verify name decryption works correctly
17. **Test successful login for user with encrypted phone**: Verify phone decryption works correctly

### Account Status Validation Tests

18. **Test successful login only for verified email accounts**: Verify email_verified_at is checked and login succeeds when not null
19. **Test successful login only for non-deleted accounts**: Verify deleted_at is checked and login succeeds when null
20. **Test that password comparison uses bcrypt.compare**: Verify bcrypt.compare is called with plain password and hashed password

### Logging and Audit Tests

21. **Test that successful login is logged**: Verify appropriate log entry is created for successful authentication
22. **Test that user public_id is logged on successful login**: Verify public_id is included in success log for audit trail

---

## Unit Test Cases - Failure Scenarios

### Missing Required Fields

1. **Test login fails when email is missing**: Verify HTTP 400 with validation error indicating email is required
2. **Test login fails when password is missing**: Verify HTTP 400 with validation error indicating password is required
3. **Test login fails when both fields are missing**: Verify HTTP 400 with multiple validation errors
4. **Test login fails when email is empty string**: Verify HTTP 400 with validation error for empty email
5. **Test login fails when password is empty string**: Verify HTTP 400 with validation error for empty password

### Invalid Email Format

6. **Test login fails with invalid email format (no @ symbol)**: Verify HTTP 400 with email format validation error
7. **Test login fails with invalid email format (no domain)**: Verify error for emails like "user@"
8. **Test login fails with invalid email format (no local part)**: Verify error for emails like "@example.com"
9. **Test login fails with invalid email format (spaces in middle)**: Verify error for malformed emails
10. **Test login fails with invalid email format (multiple @ symbols)**: Verify error for emails like "user@@example.com"

### Authentication Failures

11. **Test login fails when email does not exist in database**: Verify HTTP 401 with generic "Invalid credentials" message
12. **Test login fails when password is incorrect**: Verify HTTP 401 with generic "Invalid credentials" message
13. **Test login fails with correct email but wrong password**: Verify HTTP 401 and error message does not reveal email exists
14. **Test login fails when password is correct but email not found**: Verify HTTP 401 with same generic error message
15. **Test that error message is identical for non-existent email and wrong password**: Verify no user enumeration is possible

### Account Status Failures

16. **Test login fails when account is deleted (deleted_at is not null)**: Verify HTTP 401 with generic "Invalid credentials" message (not revealing account was deleted)
17. **Test login fails when email is not verified (email_verified_at is null)**: Verify HTTP 403 with specific error message about email verification required
18. **Test login fails for account deleted yesterday**: Verify old deleted accounts cannot login
19. **Test login fails for account with future deleted_at timestamp**: Verify any non-null deleted_at prevents login

### Data Type Validation

20. **Test login fails when email is not a string**: Verify HTTP 400 with data type validation error
21. **Test login fails when password is not a string**: Verify HTTP 400 with data type validation error
22. **Test login fails when email is null**: Verify HTTP 400 with validation error
23. **Test login fails when password is null**: Verify HTTP 400 with validation error

### JWT Generation Failures

24. **Test login fails when JwtService throws error**: Verify proper error handling and HTTP 500 when token generation fails
25. **Test login fails when user has no roles assigned**: Verify error handling when role lookup fails during token generation

### Security Tests

26. **Test that plain text password is never logged**: Verify logs do not contain password even on errors
27. **Test that failed login attempts are logged for security monitoring**: Verify failed login creates audit log entry
28. **Test that bcrypt.compare is called with correct parameters**: Verify plain password and hash are passed correctly
29. **Test that multiple failed login attempts are each logged separately**: Verify each failed attempt creates separate log entry

---

## Unit Test Cases - Edge Cases

### Boundary Value Tests

1. **Test login with email at exactly 255 characters**: Verify maximum length email is handled correctly
2. **Test login with password at exactly 1 character**: Verify minimum valid password length is accepted
3. **Test login with password at 100+ characters**: Verify long passwords work correctly with bcrypt
4. **Test login with email containing maximum valid subdomain levels**: Verify complex but valid email formats work

### Special Character Handling

5. **Test login with email containing plus sign (user+tag@example.com)**: Verify RFC-compliant email formats work
6. **Test login with email containing dots (user.name@example.com)**: Verify dots in local part work correctly
7. **Test login with email containing numbers**: Verify alphanumeric emails work
8. **Test login with password containing only special characters**: Verify special character passwords work with bcrypt

### Encryption Edge Cases

9. **Test login for user with is_encrypted = false**: Verify non-encrypted users can still login
10. **Test login for user with is_encrypted = true**: Verify encrypted users require decryption before password check
11. **Test login when encryption service temporarily fails**: Verify proper error handling and user-friendly error message
12. **Test login when decryption returns null or empty values**: Verify appropriate error handling

### Database Edge Cases

13. **Test login when database connection is temporarily lost**: Verify proper error handling and timeout
14. **Test login when user exists but has null password (OAuth users)**: Verify appropriate error for users without password
15. **Test login when JwtService is not initialized**: Verify proper error message when JWT service is not ready

### Concurrent Login Tests

16. **Test multiple concurrent login attempts with same credentials**: Verify system handles concurrent requests correctly
17. **Test login immediately after registration**: Verify newly registered users can login right away
18. **Test login for user with multiple roles**: Verify JWT generation handles multiple roles correctly

### Token Expiration Configuration

19. **Test that expiration_time reflects current JWT_EXPIRED_TIME env value**: Verify dynamic configuration is used
20. **Test login when JWT_EXPIRED_TIME is not set in env**: Verify default expiration value is used (300000ms as per constants)

---

## Technical Notes

### Implementation Guidelines

- Follow the existing domain model pattern as documented in domain-model-pattern-documentation.md
- Use the standardized response format as per architecture-standardized-response-format-implementation-documentation.md
- Implement validation following the validation-error-format-examples.md
- Use i18n pattern for error messages as documented in domain-i18n-pattern-guide.md
- Use existing JwtService from libs/jwt/services/jwt.service.ts
- Implement encryption/decryption using existing user PII encryption service as per security-user-pii-encryption-documentation.md
- Follow the request-response flow as per architecture-request-response-flow-documentation.md
- Use bcrypt.compare for password verification (bcrypt already used in registration)

### Password Verification Flow

1. Retrieve user from database by email (lowercase, trimmed)
2. Check if user exists (if not, return generic error)
3. Check if account is deleted (if yes, return generic error)
4. Check if email is verified (if not, return specific error)
5. Decrypt user data if is_encrypted = true
6. Use bcrypt.compare(plainPassword, hashedPassword)
7. If password matches, generate JWT token
8. Return token with type and expiration time

### JWT Token Generation

- Use existing JwtService.generateAccessToken(publicId) method
- The service will automatically:
  - Lookup user by public_id
  - Lookup user roles
  - Lookup role permissions
  - Build JWT payload with all required claims
  - Sign token with RS256 algorithm using private key
  - Return signed JWT string

### Error Response Format

- Follow the standardized error response format
- Use proper HTTP status codes:
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (invalid credentials, deleted accounts)
  - 403: Forbidden (unverified email)
  - 500: Internal Server Error (system failures)
- Include proper error codes for each failure type
- Provide clear, user-friendly error messages in English
- Support i18n for future multilingual support
- Use generic "Invalid credentials" for both wrong email and wrong password

### Security Considerations

- Never log plain text passwords under any circumstances
- Use generic error messages to prevent user enumeration
- Always decrypt user data before password comparison for encrypted users
- Use parameterized queries to prevent SQL injection
- Validate and sanitize email before database lookup
- Log failed login attempts for security monitoring
- Log successful logins for audit trail
- Do not reveal if email exists or not in error messages
- Do not reveal if account is deleted in error messages (use generic invalid credentials)

### Logging Requirements

- Log successful login attempts with:
  - Timestamp
  - User public_id
  - Email (can be logged as it's already authenticated)
  - Log level: INFO
- Log failed login attempts with:
  - Timestamp
  - Email attempted (for security monitoring)
  - Failure reason (email not found, wrong password, account deleted, email not verified)
  - Log level: WARN
- Never log passwords in any log entry

---

## Definition of Done

- [ ] API endpoint implemented at /v1/auth/login
- [ ] All acceptance criteria met
- [ ] All success test cases (20+) passing
- [ ] All failure test cases (25+) passing
- [ ] All edge case tests (20+) passing
- [ ] API documentation updated in Swagger
- [ ] Code follows project coding standards and patterns
- [ ] Code reviewed and approved
- [ ] PII encryption/decryption working correctly
- [ ] JWT token generation using existing JwtService
- [ ] Password verification using bcrypt.compare
- [ ] Email case-insensitive matching implemented
- [ ] Account status validation (deleted_at, email_verified_at) working
- [ ] Generic error messages preventing user enumeration
- [ ] Proper logging for security monitoring and audit trail
- [ ] Error messages properly internationalized
- [ ] No security vulnerabilities identified
- [ ] No passwords logged in any circumstance
- [ ] Performance tested with expected load
- [ ] Merged to development branch

---

## Dependencies

- Existing JwtService from libs/jwt module
- User PII encryption service
- bcrypt library for password verification
- Users must have email_verified_at set (registration automatically sets this)
- RS256 private key must be configured for JWT signing
- JWT_EXPIRED_TIME environment variable for token expiration configuration

---

## Table Schema

```sql
-- core.users definition

-- Drop table

-- DROP TABLE core.users;

CREATE TABLE core.users (
	public_id uuid DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	email text NULL,
	phone text NULL,
	"password" varchar(255) NULL,
	image varchar(500) NULL,
	provider text NULL,
	provider_id text NULL,
	email_verified_at timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	is_encrypted bool DEFAULT false NOT NULL,
	CONSTRAINT users_email_unique UNIQUE (email),
	CONSTRAINT users_pkey PRIMARY KEY (id),
	CONSTRAINT users_public_id_unique UNIQUE (public_id),
	CONSTRAINT users_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT users_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX idx_users_is_encrypted ON core.users USING btree (is_encrypted);
CREATE INDEX users_email_index ON core.users USING btree (email);
CREATE INDEX users_phone_index ON core.users USING btree (phone);
CREATE INDEX users_public_id_index ON core.users USING btree (public_id);

-- core.roles definition

-- Drop table

-- DROP TABLE core.roles;

CREATE TABLE core.roles (
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz NULL,
	deleted_at timestamptz NULL,
	id_creator uuid NULL,
	id_updater uuid NULL,
	id uuid DEFAULT uuid_generate_v4() NOT NULL,
	CONSTRAINT roles_key_unique UNIQUE (key),
	CONSTRAINT roles_pkey PRIMARY KEY (id),
	CONSTRAINT roles_id_creator_foreign FOREIGN KEY (id_creator) REFERENCES core.users(public_id),
	CONSTRAINT roles_id_updater_foreign FOREIGN KEY (id_updater) REFERENCES core.users(public_id)
);
CREATE INDEX roles_key_index ON core.roles USING btree (key);
```

---

## Assumptions

- User accounts are created via the registration endpoint
- Registration automatically sets email_verified_at to current timestamp
- User passwords are hashed with bcrypt (salt rounds: 10) during registration
- User PII data (name, email, phone) is encrypted in database with is_encrypted = true
- The encryption service is configured and operational
- The JwtService is properly initialized with private key
- Database connection pool is properly configured
- Users must have at least one role assigned to login successfully
- The customer role exists in core.roles table
- JWT_EXPIRED_TIME environment variable is set (defaults to 300000ms if not set)
- Email verification is required for login (email_verified_at must not be null)
- Deleted accounts (deleted_at not null) cannot login
- No OAuth provider authentication in this phase (all users use email/password)

---

## Out of Scope

- Refresh token implementation
- Account lockout after X failed attempts
- Rate limiting per IP or per email
- Email notifications on login from new device/IP
- Remember me functionality
- Two-factor authentication (2FA)
- Forgot password functionality
- Password reset functionality
- Social login (OAuth providers: Google, Facebook, etc.)
- Device tracking and management
- Session management and revocation
- Login history tracking in database
- Storing JWT tokens in database for revocation
- CAPTCHA implementation
- Brute force protection
- IP-based geolocation
- Suspicious login detection
- Account recovery mechanisms
- Magic link authentication

---

## Related Documentation

- docs/domain-model-pattern-documentation.md
- docs/architecture-standardized-response-format-implementation-documentation.md
- docs/validation-error-format-examples.md
- docs/domain-i18n-pattern-guide.md
- docs/security-user-pii-encryption-documentation.md
- docs/architecture-request-response-flow-documentation.md
- docs/error-handling-domain-error-codes-guide.md
- docs/architecture-jwt-guard-guide.md (if exists)
- src/libs/jwt/services/jwt.service.ts
- src/libs/jwt/constants/jwt.constants.ts
- src/libs/jwt/interfaces/index.ts
- src/domains/auth/register/customer/customer-registration.service.ts (reference for bcrypt usage)

---

```

```
