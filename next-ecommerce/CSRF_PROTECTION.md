# CSRF Protection Implementation

This document explains how CSRF (Cross-Site Request Forgery) protection is implemented in your e-commerce app.

## Overview

CSRF protection prevents malicious websites from making unauthorized requests on behalf of your users. The implementation includes:

1. **Token Generation**: Secure, time-limited CSRF tokens
2. **Token Validation**: Server-side verification of tokens
3. **Automatic Integration**: Easy-to-use hooks and utilities
4. **Form Protection**: Automatic CSRF token inclusion in forms

## Setup

### 1. Environment Variables

Add the CSRF secret to your `.env` file:

```env
CSRF_SECRET=your-super-secret-csrf-key-change-this-in-production
```

### 2. API Routes

The CSRF API route is available at `/api/csrf`:

- `GET /api/csrf` - Generate a new CSRF token
- `POST /api/csrf` - Refresh CSRF token (requires existing valid token)

## Usage

### 1. In React Components

Use the `useCSRF` hook to get CSRF tokens:

```tsx
import { useCSRF } from '@/hooks/use-csrf'

function MyForm() {
  const { csrfToken, isLoading } = useCSRF()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <form method="POST" action="/api/my-endpoint">
      <input type="hidden" name="csrf" value={csrfToken || ''} />
      {/* Your form fields */}
    </form>
  )
}
```

### 2. Using the CSRF Form Component

For automatic CSRF protection:

```tsx
import CSRFForm from '@/components/shared/csrf-form'

function MyForm() {
  return (
    <CSRFForm method="POST" action="/api/my-endpoint">
      {/* Your form fields */}
    </CSRFForm>
  )
}
```

### 3. In API Routes

Protect your API routes with CSRF validation:

```tsx
import { verifyCSRFToken } from '@/lib/csrf'

export async function POST(req: NextRequest) {
  // Verify CSRF token
  const isValid = await verifyCSRFToken(req)
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Your API logic here
}
```

### 4. Using Enhanced Fetch

For AJAX requests, use the enhanced fetch function:

```tsx
import { csrfFetch } from '@/lib/csrf-fetch'

// Automatically includes CSRF token
const response = await csrfFetch('/api/my-endpoint', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' })
})
```

### 5. Creating Form Data with CSRF

```tsx
import { createCSRFFormData } from '@/lib/csrf-fetch'

const formData = createCSRFFormData({
  name: 'John Doe',
  email: 'john@example.com'
})

const response = await fetch('/api/submit', {
  method: 'POST',
  body: formData
})
```

## Security Features

### Token Security
- **Cryptographic Signatures**: Tokens are signed with HMAC-SHA256
- **Time Limitation**: Tokens expire after 24 hours
- **Random Generation**: Uses cryptographically secure random bytes
- **HttpOnly Cookies**: Tokens stored in secure, httpOnly cookies

### Validation
- **Server-side Verification**: All tokens validated on the server
- **Token Matching**: Request token must match cookie token
- **Signature Verification**: Prevents token tampering
- **Expiry Checking**: Prevents replay attacks

### Protection Scope
- **All POST/PUT/PATCH/DELETE requests** are protected
- **GET requests** are excluded (safe by HTTP specification)
- **Public endpoints** can be excluded (auth, health checks, etc.)

## Configuration

### Customizing Token Expiry

Edit `lib/csrf.ts` to change token expiry:

```tsx
// Change from 24 hours to 12 hours
const tokenAge = Date.now() - parseInt(timestamp)
if (tokenAge > 12 * 60 * 60 * 1000) { // 12 hours
  return false
}
```

### Excluding Public Endpoints

Edit `lib/csrf-middleware.ts` to add more public endpoints:

```tsx
const publicEndpoints = [
  '/api/auth',
  '/api/csrf',
  '/api/health',
  '/api/public', // Add your public endpoints
]
```

## Best Practices

1. **Always use CSRF protection** for state-changing operations
2. **Keep CSRF secret secure** and unique per environment
3. **Rotate CSRF secrets** periodically in production
4. **Monitor CSRF failures** for potential attacks
5. **Use HTTPS** in production to protect tokens in transit

## Troubleshooting

### Common Issues

1. **"Invalid CSRF token" errors**
   - Check if CSRF_SECRET is set correctly
   - Verify token hasn't expired
   - Ensure cookies are enabled

2. **Tokens not loading**
   - Check network requests to `/api/csrf`
   - Verify cookie settings
   - Check browser console for errors

3. **Form submissions failing**
   - Ensure CSRF token is included in form
   - Check if token is being sent in headers
   - Verify server-side validation logic

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_CSRF=true
```

This will log CSRF validation attempts to the console.

## Migration Guide

If you're adding CSRF protection to existing forms:

1. **Add CSRF token** to all forms
2. **Update API routes** to validate tokens
3. **Test thoroughly** in development
4. **Deploy gradually** to production
5. **Monitor for errors** and adjust as needed

## Security Considerations

- CSRF protection is essential for all state-changing operations
- Tokens should be unique per session
- Never expose CSRF secrets in client-side code
- Regularly audit CSRF implementation
- Consider additional security measures for high-value operations 