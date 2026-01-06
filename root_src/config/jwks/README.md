# JWKS Directory

This directory contains local JWKS (JSON Web Key Set) files for JWT token validation fallback.

## Setup

To download the JWKS file from your authentication provider (run from root_src directory):

```bash
curl -s https://auth.upnvj.ac.id/realms/myapp-test/protocol/openid-connect/certs \
  -o config/jwks/jwks.json
```

## Purpose

- **Primary**: The application uses remote JWKS endpoints for JWT validation
- **Fallback**: If the remote endpoint is unavailable, it falls back to the local JWKS file
- **Reliability**: Ensures authentication continues working even during network issues

## Note

Update the URL in the curl command to match your authentication provider's JWKS endpoint.

## File Location

The auth service looks for the JWKS file at: `./config/jwks/jwks.json` (relative to the root_src directory)
