# JIRA Task: Customer Registration API Endpoint

## Task Name

Implement Customer Registration Endpoint with Email/Password Authentication

---

## User Story

**As a** new customer of eBengkelku  
**I want to** register an account using my email and password  
**So that** I can access the platform services and manage my vehicles

---

## Description

Create a new API endpoint at `/v1/register/customer` that allows new customers to register in the eBengkelku platform using email and password authentication. The endpoint should validate user input, create a new user record in the `core.users` table, automatically assign the "customer" role, and return the user's information with all sensitive data properly decrypted.

---

## Acceptance Criteria

### Functional Requirements

1. The endpoint must accept POST requests at `/v1/register/customer`
2. The endpoint must require name, email, and password as mandatory fields
3. The endpoint must accept phone and image as optional fields
4. The endpoint must validate email uniqueness before creating the user
5. The endpoint must validate password meets minimum requirements (8 characters, lowercase, uppercase, number, special character)
6. The endpoint must hash the password before storing in database
7. The endpoint must automatically set `email_verified_at` to current timestamp upon successful registration
8. The endpoint must automatically assign the "customer" role to the newly registered user via `core.user_roles` table
9. The endpoint must generate a unique `public_id` using UUID v4
10. The endpoint must set `created_at` timestamp to current time
11. The endpoint must return HTTP 201 status code on successful registration
12. The endpoint must return the complete user object with all fields decrypted in the response
13. The endpoint must NOT return JWT token in the registration response
14. The endpoint must support optional profile image upload using existing file upload system
15. The endpoint must validate email format according to RFC 5322 standard

### Technical Requirements

1. Use the existing domain model pattern for implementation
2. Follow the standardized response format as per project documentation
3. Implement proper error handling with domain error codes
4. All PII data must be encrypted in database and decrypted in response
5. Use transaction for user creation and role assignment to maintain data integrity
6. Follow the existing auto-crud pattern if applicable
7. Implement proper validation using DTOs (Data Transfer Objects)
8. Use existing i18n pattern for error messages
9. Follow the Laravel-inspired pattern for repository implementation
10. Ensure proper logging for audit trail

### Security Requirements

1. Password must be hashed using bcrypt with appropriate salt rounds
2. Email must be sanitized to prevent SQL injection
3. Input validation must prevent XSS attacks
4. Rate limiting will be implemented in future phase (not in this task)
5. Encrypted fields must use the configured encryption service

---

## Expected Request Body

### Required Fields

- **name**: string, 1-255 characters, user's full name
- **email**: string, valid email format, 1-255 characters, must be unique
- **password**: string, minimum 8 characters, must contain lowercase, uppercase, number, and special character

### Optional Fields

- **phone**: string, 1-50 characters, phone number in any format
- **image**: string, 1-500 characters, URL or file path to profile image (can be uploaded via existing file upload endpoint first)

### Request Body Example Structure

The request body should contain the following fields with their respective validation rules:

- name field must not be empty and should contain valid characters
- email field must be in valid email format and not already registered
- password field must meet complexity requirements
- phone field if provided should contain valid phone number characters
- image field if provided should be a valid URL or file path

---

## Expected Response Body (Data Part)

### Success Response (HTTP 201)

The data object should include all user information with the following fields:

- **id**: integer, primary key of the user
- **public_id**: string (UUID v4), unique public identifier
- **name**: string, user's full name (decrypted)
- **email**: string, user's email address (decrypted)
- **phone**: string or null, user's phone number (decrypted if exists)
- **image**: string or null, URL to user's profile image
- **provider**: null (for email/password registration)
- **provider_id**: null (for email/password registration)
- **email_verified_at**: timestamp (ISO 8601 format), automatically set to current time
- **created_at**: timestamp (ISO 8601 format), user creation time
- **updated_at**: null (for new registration)
- **deleted_at**: null (for new registration)
- **id_creator**: null (for self-registration)
- **id_updater**: null (for new registration)
- **roles**: array of role objects, containing at least the "customer" role with fields:
  - id: integer, role primary key
  - key: string, role key ("customer")
  - name: string, role display name
  - description: string or null, role description

Note: The password field must NOT be included in the response for security reasons.

---

## Unit Test Cases - Success Scenarios

### Basic Registration Tests

1. **Test successful customer registration with all required fields only**: Verify that a customer can register with name, email, and password, and receives HTTP 201 with complete user data
2. **Test successful registration with valid email format**: Verify that registration succeeds when email follows RFC 5322 standard format
3. **Test successful registration with minimum valid password**: Verify that password with exactly 8 characters meeting all requirements is accepted
4. **Test successful registration with long password**: Verify that password with 50+ characters meeting requirements is accepted
5. **Test successful registration with all optional fields provided**: Verify that registration succeeds when phone and image are included

### Password Validation Tests

6. **Test successful registration with password containing special characters**: Verify various special characters (!@#$%^&\*) are accepted
7. **Test successful registration with password containing spaces**: Verify that passwords with spaces are handled correctly
8. **Test successful registration with password containing numbers at different positions**: Verify numbers can be at start, middle, or end

### Email Format Tests

9. **Test successful registration with email containing dots**: Verify emails like john.doe@example.com are accepted
10. **Test successful registration with email containing plus sign**: Verify emails like user+tag@example.com are accepted
11. **Test successful registration with email containing numbers**: Verify emails like user123@example.com are accepted
12. **Test successful registration with email containing subdomain**: Verify emails like user@mail.example.com are accepted

### Data Handling Tests

13. **Test that public_id is automatically generated**: Verify that UUID v4 is created and unique for each registration
14. **Test that email_verified_at is automatically set**: Verify timestamp is set to current time
15. **Test that created_at timestamp is set correctly**: Verify creation timestamp is accurate
16. **Test that customer role is automatically assigned**: Verify user_roles table contains entry with customer role
17. **Test that password is hashed before storage**: Verify stored password is not plain text
18. **Test that encrypted fields are decrypted in response**: Verify name, email, phone are returned decrypted

### Optional Fields Tests

19. **Test successful registration without phone**: Verify phone field is null when not provided
20. **Test successful registration without image**: Verify image field is null when not provided
21. **Test successful registration with valid phone number**: Verify phone number is stored and returned correctly
22. **Test successful registration with profile image URL**: Verify image URL is stored and returned correctly

---

## Unit Test Cases - Failure Scenarios

### Missing Required Fields

1. **Test registration fails when name is missing**: Verify HTTP 400 with validation error indicating name is required
2. **Test registration fails when email is missing**: Verify HTTP 400 with validation error indicating email is required
3. **Test registration fails when password is missing**: Verify HTTP 400 with validation error indicating password is required
4. **Test registration fails when all fields are missing**: Verify HTTP 400 with multiple validation errors

### Invalid Email Format

5. **Test registration fails with invalid email format (no @ symbol)**: Verify HTTP 400 with email format validation error
6. **Test registration fails with invalid email format (no domain)**: Verify error for emails like "user@"
7. **Test registration fails with invalid email format (no local part)**: Verify error for emails like "@example.com"
8. **Test registration fails with invalid email format (spaces)**: Verify error for emails containing spaces
9. **Test registration fails with invalid email format (multiple @ symbols)**: Verify error for emails like "user@@example.com"

### Password Validation Failures

10. **Test registration fails when password is less than 8 characters**: Verify HTTP 400 with password length error
11. **Test registration fails when password has no lowercase letter**: Verify HTTP 400 with password complexity error
12. **Test registration fails when password has no uppercase letter**: Verify HTTP 400 with password complexity error
13. **Test registration fails when password has no number**: Verify HTTP 400 with password complexity error
14. **Test registration fails when password has no special character**: Verify HTTP 400 with password complexity error
15. **Test registration fails when password is only numbers**: Verify HTTP 400 with password complexity error
16. **Test registration fails when password is only letters**: Verify HTTP 400 with password complexity error

### Duplicate Email

17. **Test registration fails when email already exists**: Verify HTTP 409 with duplicate email error
18. **Test registration fails when email exists with different case**: Verify case-insensitive email uniqueness check

### Field Length Validation

19. **Test registration fails when name exceeds 255 characters**: Verify HTTP 400 with field length error
20. **Test registration fails when email exceeds 255 characters**: Verify HTTP 400 with field length error
21. **Test registration fails when phone exceeds 50 characters**: Verify HTTP 400 with field length error
22. **Test registration fails when image URL exceeds 500 characters**: Verify HTTP 400 with field length error

### Invalid Data Types

23. **Test registration fails when name is not a string**: Verify HTTP 400 with data type validation error
24. **Test registration fails when email is not a string**: Verify HTTP 400 with data type validation error

---

## Unit Test Cases - Edge Cases

### Boundary Value Tests

1. **Test registration with name at exactly 255 characters**: Verify boundary value is accepted
2. **Test registration with email at exactly 255 characters**: Verify maximum length email is handled
3. **Test registration with password at exactly 8 characters**: Verify minimum valid password length
4. **Test registration with phone at exactly 50 characters**: Verify maximum phone length

### Special Character Handling

5. **Test registration with name containing special characters**: Verify names with apostrophes, hyphens, accents are handled
6. **Test registration with name containing Unicode characters**: Verify international character support
7. **Test registration with email containing consecutive dots**: Verify emails like user..name@example.com handling

### Concurrent Registration

8. **Test concurrent registration attempts with same email**: Verify transaction integrity prevents duplicate registrations
9. **Test registration when database connection is temporarily lost**: Verify proper error handling and rollback

### Database Constraint Tests

10. **Test registration when role table is empty**: Verify error handling when customer role doesn't exist
11. **Test registration verifies transaction rollback on role assignment failure**: Verify user is not created if role assignment fails
12. **Test registration with malformed UUID generation**: Verify error handling if UUID generation fails

---

## Technical Notes

### Implementation Guidelines

- Follow the existing domain model pattern as documented in domain-model-pattern-documentation.md
- Use the standardized response format as per architecture-standardized-response-format-implementation-documentation.md
- Implement validation following the validation-error-format-examples.md
- Use i18n pattern for error messages as documented in domain-i18n-pattern-guide.md
- Implement encryption/decryption using existing user PII encryption service as per security-user-pii-encryption-documentation.md
- Follow the request-response flow as per architecture-request-response-flow-documentation.md

### Database Transactions

- Use database transactions to ensure atomicity between user creation and role assignment
- Rollback entire transaction if any step fails
- Ensure proper error handling and cleanup

### Validation Order

1. Validate request body structure and required fields
2. Validate field formats (email, password complexity)
3. Validate field lengths
4. Check email uniqueness
5. Validate role existence in database

### Error Response Format

- Follow the standardized error response format
- Include proper error codes for each validation failure
- Provide clear, user-friendly error messages in English
- Support i18n for future multilingual support

### Security Considerations

- Never log plain text passwords
- Ensure password is hashed before any database operation
- Sanitize all inputs to prevent injection attacks
- Validate and sanitize email before uniqueness check
- Use parameterized queries to prevent SQL injection

---

## Definition of Done

- [ ] API endpoint implemented at /v1/register/customer
- [ ] All acceptance criteria met
- [ ] All success test cases (20+) passing
- [ ] All failure test cases (20+) passing
- [ ] All edge case tests (10+) passing
- [ ] Integration tests passing
- [ ] API documentation updated in Swagger
- [ ] Code follows project coding standards and patterns
- [ ] Code reviewed and approved
- [ ] PII encryption/decryption working correctly
- [ ] Transaction rollback tested and working
- [ ] Error messages properly internationalized
- [ ] No security vulnerabilities identified
- [ ] Performance tested with expected load
- [ ] Merged to development branch

---

## Dependencies

- Existing file upload system (if customer wants to upload profile image)
- User PII encryption service
- Database migration 20260113000001_create_core_users_table.js
- Database migration 20260113000002_create_core_roles_table.js
- Database migration 20260113000004_create_core_user_roles_table.js
- Database migration 20260122230001_alter_core.users_add_audit_columns.js
- Customer role must exist in core.roles table with key "customer"

---

## Assumptions

- The "customer" role already exists in the core.roles table with key="customer"
- The existing file upload system is functional and documented
- PII encryption service is configured and operational
- Database connection pool is properly configured for transactions
- Email service is not required for this phase (no verification emails)
- JWT authentication will be handled by separate login endpoint
- Rate limiting and CAPTCHA will be implemented in future phases

---

## Out of Scope

- Email verification functionality
- SMS/Phone verification
- OAuth provider registration (Google, Facebook, etc.)
- JWT token generation and return
- Rate limiting
- CAPTCHA implementation
- Password strength meter
- Terms and conditions acceptance
- Age verification
- Auto-login after registration
- Welcome email sending
- Phone number format validation beyond length
- Profile completion wizard

---

## Related Documentation

- docs/domain-model-pattern-documentation.md
- docs/architecture-standardized-response-format-implementation-documentation.md
- docs/validation-error-format-examples.md
- docs/domain-i18n-pattern-guide.md
- docs/security-user-pii-encryption-documentation.md
- docs/architecture-request-response-flow-documentation.md
- docs/error-handling-domain-error-codes-guide.md

---

## Estimated Story Points

**8 Points** - Medium complexity feature requiring database transactions, validation, encryption, role assignment, and comprehensive testing

---

## Priority

**High** - Core functionality required for customer onboarding

---

## Labels

`backend`, `api`, `authentication`, `customer`, `registration`, `user-management`, `v1`

---

## Created Date

January 27, 2026
