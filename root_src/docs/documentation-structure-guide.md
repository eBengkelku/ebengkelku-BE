# Documentation Structure Guide

## Overview

This guide defines standardized structure for all documentation in this project. All documentation MUST be **concise**, **scannable**, and **actionable**. Maximum length: 300 lines per document.

---

## TL;DR

**Core Principles**:
- ✅ **Concise** - No fluff, straight to the point
- ✅ **Scannable** - Easy to skim with headings, bullets, tables
- ✅ **Actionable** - Focus on "how to" not theory
- ✅ **Max 300 lines** - Keep documentation brief

**Required in ALL Documents**:
1. Overview (2-3 sentences)
2. TL;DR section (3-5 bullets)
3. Code examples (where applicable)
4. Related documentation links

**Document Types & Length**:
- **Quickstart** (50-150 lines): Get started in 5-10 min
- **Guide** (150-300 lines): Step-by-step how-to
- **Examples** (100-300 lines): Code samples
- **Documentation** (200-300 lines): Complete reference
- **Reference** (150-300 lines): API/technical specs
- **Tutorial** (150-300 lines): Teaching concepts
- **Overview** (100-200 lines): High-level intro

---

## Universal Structure

All documents MUST include:
- Title
- Overview (2-3 sentences)
- TL;DR (3-5 bullets)
- Main content sections
- Related documentation

---

## Document Type Structures

### 1. QUICKSTART (50-150 lines)

**Purpose**: Get started in 5-10 minutes

**Essential Sections**:
- Overview: What you'll accomplish (1 sentence)
- TL;DR: Outcome, time estimate, prerequisites
- Quick Setup: 3-5 numbered steps with commands
- Verify It Works: How to test
- Next Steps: Links to guide, examples, reference

---

### 2. GUIDE (150-300 lines)

**Purpose**: Step-by-step comprehensive instructions

**Essential Sections**:
- Overview: What guide covers (2-3 sentences)
- TL;DR: Summary, key commands, critical rules
- Prerequisites: Required knowledge/tools
- Step-by-Step Instructions: Each step with code example
- Common Patterns: 2-3 use case patterns
- Best Practices: DO's and DON'Ts
- Quick Reference: Table of key items
- Related Documentation

---

### 3. EXAMPLES (100-300 lines)

**Purpose**: Show code samples and use cases

**Essential Sections**:
- Overview: What scenarios covered
- TL;DR: List of examples with one-line descriptions
- Example 1, 2, 3...: Each with Use Case, Code, Explanation, Output
- Comparison: When to use which example
- Related Documentation

---

### 4. DOCUMENTATION (200-300 lines)

**Purpose**: Complete comprehensive reference

**Essential Sections**:
- Overview: System description (2-3 sentences)
- TL;DR: What it does, key components, critical concepts
- Architecture Overview: High-level design
- Core Concepts: 3-5 key concepts with brief explanations
- Components: Main components with purpose and usage
- Configuration: Options table
- Usage Examples: 2-3 common use cases
- Best Practices: DO's and DON'Ts
- Related Documentation

---

### 5. REFERENCE (150-300 lines)

**Purpose**: Technical specifications and API reference

**Essential Sections**:
- Overview: What reference covers (1-2 sentences)
- TL;DR: Quick lookup summary
- API Reference: Methods with syntax, parameters, returns, examples
- Configuration Options: Table format
- Error Codes: Table with code, status, description, resolution
- Type Definitions: Key interfaces/types
- Quick Reference Table
- Related Documentation

---

### 6. TUTORIAL (150-300 lines)

**Purpose**: Teach concepts step-by-step

**Essential Sections**:
- Overview: What you'll learn (1-2 sentences)
- TL;DR: Learning goals, prerequisites, time estimate
- Learning Objectives: 3-4 objectives
- Part 1, 2, 3: Each with explanation, "Try It Yourself", checkpoint
- Summary: What you learned
- Next Steps: What to learn next
- Related Documentation

---

### 7. OVERVIEW (100-200 lines)

**Purpose**: High-level introduction

**Essential Sections**:
- Overview: High-level description (3-4 sentences)
- TL;DR: Key points, when to use, when NOT to use
- What Is [Topic]: Brief explanation (2-3 paragraphs max)
- Why Use [Topic]: Benefits and use cases
- Key Concepts: High-level explanations (no deep dive)
- How It Works: Simple flow diagram
- When To Use: Use when / Don't use when
- Getting Started: Links to quickstart, docs, examples
- Related Documentation

---

## Scope-Specific Requirements

| Scope | Must Include | Key Sections |
|-------|--------------|--------------|
| **error-handling** | Error codes table, response format (JSON), frontend integration | Error codes, response format, integration examples |
| **api** | Request/response examples, status codes, auth requirements | Endpoint, authentication, request/response, error responses |
| **validation** | Validation rules table, error format, DTO examples | Validation rules, DTO example, error format |
| **architecture** | Diagrams/visual flow, component relationships, design decisions | Architecture diagram, components, design rationale |
| **database** | Schema examples, migration examples, query examples | Schema, migration, query examples |
| **authentication** | Security considerations, token examples, integration steps | Security warnings, token example, integration steps |

---

## Critical Rules

### ✅ MUST DO

1. **Be Concise**
   - Max 3-4 sentences per paragraph
   - Use bullet points over paragraphs
   - Remove unnecessary words

2. **Be Scannable**
   - Clear headings
   - Tables for comparisons
   - Code blocks for examples

3. **Be Actionable**
   - Focus on "how to" not "about"
   - Working code examples
   - Clear next steps

4. **Stay Under 300 Lines**
   - Split long docs into multiple files
   - Link related documentation
   - Remove redundant content

5. **Include Required Sections**
   - Overview (always)
   - TL;DR (always)
   - Code examples (where applicable)
   - Related docs (always)

### ❌ AVOID

1. **Long Paragraphs** - Max 3-4 lines, then break
2. **Repetition** - Explain once, reference elsewhere
3. **Unnecessary Background** - Focus on current implementation
4. **Mixing Topics** - One doc per feature
5. **Vague Statements** - Be specific with metrics/examples

---

## Length Guidelines

| Type | Min | Max | Ideal | Purpose |
|------|-----|-----|-------|---------|
| Quickstart | 50 | 150 | 100 | 5-10 min setup |
| Overview | 100 | 200 | 150 | High-level intro |
| Examples | 100 | 300 | 200 | Code samples |
| Reference | 150 | 300 | 250 | Specs/API |
| Guide | 150 | 300 | 250 | Step-by-step |
| Tutorial | 150 | 300 | 250 | Teaching |
| Documentation | 200 | 300 | 280 | Complete reference |

**Note**: All maximums reduced to 300 lines. Split longer docs into multiple files.

---

## Quick Decision Tree

```
What are you documenting?
│
├─→ Quick start (5-10 min) → QUICKSTART
├─→ Step-by-step how-to → GUIDE
├─→ Code examples only → EXAMPLES
├─→ Complete system docs → DOCUMENTATION
├─→ API/technical specs → REFERENCE
├─→ Teaching concepts → TUTORIAL
└─→ High-level intro → OVERVIEW
```

---

## Writing Checklist

Before submitting, verify:

**Content**:
- [ ] Overview is 2-3 sentences max
- [ ] TL;DR has 3-5 key bullets
- [ ] Code examples work and are tested
- [ ] No paragraphs longer than 4 lines
- [ ] Tables used for comparisons

**Structure**:
- [ ] Follows correct template
- [ ] Under 300 lines
- [ ] Required sections present
- [ ] Scope requirements met (if applicable)
- [ ] Related docs linked

**Style**:
- [ ] No unnecessary words
- [ ] Active voice
- [ ] Consistent terminology
- [ ] Clear action items

---

## FAQ

**Q: My doc exceeds 300 lines. What now?**
**A**: Split into multiple documents. Create overview + separate detailed guides. Link them together.

**Q: Should I include code for every concept?**
**A**: Yes, where applicable. Keep examples minimal, working, and focused.

**Q: How detailed should TL;DR be?**
**A**: 3-5 bullets answering: What is this? When to use? Key syntax/pattern.

**Q: Can I deviate from templates?**
**A**: Minor adjustments okay, but keep Overview, TL;DR, and stay under 300 lines.

---

## Examples in This Project

**Good Examples**:
- `error-handling-domain-error-codes-quickstart.md` - Quickstart ✅
- `error-handling-domain-error-codes-guide.md` - Guide ✅
- `validation-error-format-examples.md` - Examples ✅
- `architecture-request-response-flow-documentation.md` - Documentation ✅

---

**Version**: 2.0.0
**Last Updated**: 2025-10-14
**Change**: Maximum length reduced to 300 lines for all document types

For questions, refer to this guide or contact the development team.
