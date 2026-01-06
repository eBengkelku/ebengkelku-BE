# Documentation Naming Convention Guide

## Overview

This guide defines the standardized naming convention for all documentation files in this project. Following this convention ensures consistency, clarity, and easy navigation across the documentation.

---

## TL;DR

**Format**: `[scope]-[subject]-[type].md`

**Quick Examples**:
```
✅ error-handling-domain-error-codes-guide.md
✅ validation-error-format-examples.md
✅ architecture-request-response-flow-documentation.md
✅ products-pagination-api-documentation.md
```

**Rules**:
- All lowercase
- Use hyphens (`-`) to separate words
- Three components: `[scope]` + `[subject]` + `[type]`

**Common Scopes**: `architecture`, `error-handling`, `validation`, `api`, `authentication`, `database`, `[feature-name]`

**Common Types**: `guide`, `documentation`, `examples`, `quickstart`, `reference`, `tutorial`, `overview`

**Do**:
- ✅ `error-handling-custom-exceptions-guide.md`
- ✅ `api-authentication-reference.md`

**Don't**:
- ❌ `ErrorHandling.md` (wrong format)
- ❌ `custom_exceptions_guide.md` (use hyphens, not underscores)
- ❌ `guide.md` (missing scope and subject)

---

## Naming Format

All documentation files must follow this format:

```
[scope]-[subject]-[type].md
```

### Components:

1. **[scope]**: The domain or area of the system (e.g., `error-handling`, `validation`, `architecture`)
2. **[subject]**: The specific topic or feature being documented (e.g., `domain-error-codes`, `request-response-flow`)
3. **[type]**: The type of documentation (e.g., `guide`, `documentation`, `examples`, `quickstart`)

### Rules:

- All lowercase
- Use hyphens (`-`) to separate words within each component
- Use hyphens (`-`) to separate components
- File extension: `.md` (Markdown)

---

## Available Scopes

Scopes represent major domains or areas of the system:

| Scope | Description | Usage |
|-------|-------------|-------|
| `architecture` | System architecture, design patterns, flow diagrams | Documentation about system structure and design |
| `error-handling` | Error handling mechanisms, error codes, exceptions | Everything related to errors and exceptions |
| `validation` | Data validation, validation rules, validation errors | Input validation and validation mechanisms |
| `authentication` | Auth mechanisms, JWT, session management | Authentication and authorization |
| `api` | API endpoints, request/response formats | API-specific documentation |
| `database` | Database schema, migrations, queries | Database-related documentation |
| `deployment` | Deployment processes, CI/CD, infrastructure | Deployment and DevOps documentation |
| `testing` | Testing strategies, test guidelines | Testing-related documentation |
| `configuration` | App configuration, environment variables | Configuration and setup documentation |
| `[domain-name]` | Domain-specific docs (e.g., `products`, `users`, `orders`) | Feature or module specific documentation |

### Adding New Scopes:

When adding a new scope:
1. Ensure it represents a significant area of the system
2. Use singular form (e.g., `authentication`, not `authentications`)
3. Keep it concise and descriptive
4. Update this guide with the new scope

---

## Available Types

Types indicate the nature or format of the documentation:

| Type | Description | When to Use |
|------|-------------|-------------|
| `guide` | Comprehensive how-to guides | Step-by-step instructions, best practices, detailed explanations |
| `documentation` | Complete technical documentation | Full system documentation, comprehensive references |
| `examples` | Code examples and use cases | Sample code, usage examples, scenarios |
| `quickstart` | Quick start guides | Getting started quickly, minimal setup instructions |
| `reference` | API references, technical specs | Technical specifications, API endpoints, parameters |
| `tutorial` | Learning-oriented tutorials | Teaching materials, learning paths |
| `overview` | High-level overviews | Introduction to concepts, system overviews |
| `api-documentation` | API-specific documentation | REST API docs, endpoint specifications |

### Choosing the Right Type:

- **guide**: In-depth, comprehensive, explains "why" and "how"
- **documentation**: Complete reference, all features covered
- **examples**: Shows practical usage with code samples
- **quickstart**: Get started in 5-10 minutes
- **reference**: Technical specifications, lookup table
- **tutorial**: Step-by-step learning material
- **overview**: Bird's eye view, introduction
- **api-documentation**: Specific to API endpoints

---

## Examples

### Good Examples:

```
✅ error-handling-domain-error-codes-guide.md
   Scope: error-handling
   Subject: domain-error-codes
   Type: guide

✅ error-handling-domain-error-codes-quickstart.md
   Scope: error-handling
   Subject: domain-error-codes
   Type: quickstart

✅ validation-error-format-examples.md
   Scope: validation
   Subject: error-format
   Type: examples

✅ architecture-request-response-flow-documentation.md
   Scope: architecture
   Subject: request-response-flow
   Type: documentation

✅ products-pagination-api-documentation.md
   Scope: products
   Subject: pagination-api
   Type: documentation

✅ authentication-jwt-implementation-guide.md
   Scope: authentication
   Subject: jwt-implementation
   Type: guide

✅ database-migrations-reference.md
   Scope: database
   Subject: migrations
   Type: reference
```

### Bad Examples:

```
❌ DomainErrorCodesGuide.md
   Reason: Should be lowercase with hyphens

❌ error_handling_guide.md
   Reason: Use hyphens, not underscores

❌ ERROR-HANDLING-GUIDE.md
   Reason: Should be lowercase

❌ guide-error-handling.md
   Reason: Wrong order (should be scope-subject-type)

❌ error-handling.md
   Reason: Missing type

❌ domain-error-codes-guide.md
   Reason: Missing scope (should be error-handling-domain-error-codes-guide.md)
```

---

## Naming Decision Tree

```
Start
│
├─→ What is the main domain/area?
│   └─→ [scope]
│       Examples: architecture, error-handling, validation, products
│
├─→ What specific topic/feature?
│   └─→ [subject]
│       Examples: domain-error-codes, request-response-flow, jwt-implementation
│
├─→ What type of document is this?
│   └─→ [type]
│       ├─→ Comprehensive how-to? → guide
│       ├─→ Complete reference? → documentation
│       ├─→ Code samples? → examples
│       ├─→ Quick getting started? → quickstart
│       ├─→ Technical specs? → reference
│       ├─→ Learning material? → tutorial
│       └─→ High-level intro? → overview
│
└─→ Combine: [scope]-[subject]-[type].md
```

---

## Special Cases

### 1. Cross-Cutting Concerns

When documentation covers multiple scopes:

**Option A**: Choose the primary scope
```
✅ architecture-system-overview-documentation.md
   (Covers multiple areas but focuses on architecture)
```

**Option B**: Use `system` or `general` scope
```
✅ system-getting-started-guide.md
✅ general-project-structure-overview.md
```

### 2. Multiple Subject Words

When subject has many words, keep it concise:

```
✅ error-handling-exception-filter-chain-documentation.md
   (Multiple words, all connected with hyphens)

✅ api-product-search-filtering-reference.md
   (Grouped logically)
```

### 3. Version-Specific Documentation

If documenting different versions:

```
✅ api-v1-endpoints-reference.md
✅ api-v2-endpoints-reference.md
```

### 4. Language-Specific Documentation

For different languages (if needed):

```
✅ deployment-aws-setup-guide-id.md  (Indonesian)
✅ deployment-aws-setup-guide-en.md  (English)
```

Note: Prefer using i18n within the document rather than separate files.

---

## Migration Guide

### From Old Naming to New Naming

**Step 1**: Identify current file name
```
VALIDATION_ERROR_FORMAT_EXAMPLES.md
```

**Step 2**: Determine components
- What scope? → `validation`
- What subject? → `error-format`
- What type? → `examples`

**Step 3**: Apply format
```
validation-error-format-examples.md
```

### Migration Examples:

```
Old: DOMAIN_ERROR_CODES_GUIDE.md
New: error-handling-domain-error-codes-guide.md

Old: Quick_Start_Guide.md
New: system-getting-started-quickstart.md

Old: Products_API.md
New: products-api-endpoints-reference.md

Old: ErrorHandling.md
New: error-handling-overview-documentation.md
```

---

## Best Practices

### 1. Be Specific

```
✅ authentication-jwt-token-validation-guide.md
   (Specific and clear)

❌ auth-guide.md
   (Too vague)
```

### 2. Use Consistent Terminology

- Use the same scope names across related files
- Use established domain terminology
- Match naming with code/system concepts

```
✅ error-handling-domain-error-codes-guide.md
✅ error-handling-domain-error-codes-quickstart.md
✅ error-handling-domain-error-codes-examples.md
   (All use the same scope and subject base)
```

### 3. Avoid Redundancy

```
✅ products-catalog-management-guide.md
   (Concise)

❌ products-product-catalog-management-guide.md
   (Redundant "product")
```

### 4. Think About Sorting

Files will be sorted alphabetically. Related files should group together:

```
architecture-overview-documentation.md
architecture-request-response-flow-documentation.md
architecture-system-design-guide.md
---
error-handling-custom-exceptions-guide.md
error-handling-domain-error-codes-guide.md
error-handling-domain-error-codes-quickstart.md
---
validation-class-validator-usage-guide.md
validation-dto-setup-guide.md
validation-error-format-examples.md
```

### 5. Keep Subject Descriptive

```
✅ api-pagination-implementation-guide.md
   (Clear what feature is being documented)

❌ api-feature-guide.md
   (What feature?)
```

---

## Maintenance

### When Creating New Documentation:

1. Check existing scopes in this guide
2. Choose appropriate type
3. Use the naming format: `[scope]-[subject]-[type].md`
4. Add entry to project documentation index (if exists)
5. Update related documentation links

### When Modifying Scope or Type Lists:

1. Update this guide first
2. Notify team members
3. Consider impact on existing files
4. Document the change in project changelog

### Periodic Review:

- Review scope list quarterly
- Check for new patterns or needs
- Consolidate redundant scopes if needed
- Update examples based on actual usage

---

## FAQ

### Q: What if my documentation doesn't fit any scope?

**A**: Consider these options:
1. Use `system` or `general` scope for project-wide docs
2. Propose a new scope (update this guide)
3. Re-evaluate if the documentation is needed

### Q: Can I use multiple scopes?

**A**: No, each file should have one primary scope. If it truly spans multiple areas:
- Choose the most dominant scope
- Use cross-references to other related documentation
- Consider splitting into multiple files

### Q: What about README files?

**A**: README files at root or module level can keep their traditional name:
- `README.md` (root)
- `domains/products/README.md` (module)

Documentation files should follow the naming convention.

### Q: How do I handle very long names?

**A**: Keep it descriptive but concise:
```
✅ authentication-oauth2-integration-guide.md
   (Acceptable length)

❌ authentication-oauth2-third-party-provider-integration-complete-guide.md
   (Too long)

Better: authentication-oauth2-integration-guide.md
   (Use subsections in the document for details)
```

### Q: What if I need to document a specific feature in detail?

**A**: Use the domain/module as scope:
```
✅ products-inventory-management-guide.md
✅ users-profile-settings-documentation.md
✅ orders-payment-processing-guide.md
```

---

## Current Documentation Index

### Architecture
- `architecture-request-response-flow-documentation.md`

### Error Handling
- `error-handling-domain-error-codes-guide.md`
- `error-handling-domain-error-codes-quickstart.md`

### Validation
- `validation-error-format-examples.md`

### Products
- `products-pagination-api-documentation.md` (legacy naming, kept for compatibility)

---

## Summary

✅ **Always follow the format**: `[scope]-[subject]-[type].md`

✅ **Be consistent**: Use established scopes and types

✅ **Be descriptive**: Name should clearly indicate content

✅ **Think about organization**: Files should group logically

✅ **Update this guide**: When adding new scopes or patterns

---

**Version**: 1.0.0
**Last Updated**: 2025-10-14
**Maintained By**: Development Team

For questions or suggestions about this naming convention, please contact the development team or create an issue in the project repository.
