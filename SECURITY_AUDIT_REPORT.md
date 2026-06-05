# Security Audit & Code Quality Report

## Executive Summary

This report identifies critical security vulnerabilities, UX issues, and redundant code in the EverDream application. The app is a dream journal with AI analysis, NFT minting, wearable integration, and video/VR generation capabilities.

**Risk Level: HIGH** - Several critical security issues need immediate attention.

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. **Hardcoded Encryption Key in NFT Module** 
**File:** `src/lib/nft.ts` (lines 117, 167)
**Severity:** CRITICAL
**Issue:** The encryption key `'everdream-key-2024'` is hardcoded in the source code, making it trivial for attackers to decrypt all stored wallet seeds.

```typescript
// VULNERABLE CODE
const key = 'everdream-key-2024';  // EXPOSED IN SOURCE
```

**Impact:** Complete compromise of wallet security. Anyone can decrypt localStorage data.

**Fix Required:**
- Use Web Crypto API to generate a random key per device
- Store encrypted key using user's password as derivation input
- Never store raw keys in source code

### 2. **Direct Anthropic API Calls from Browser**
**File:** `src/lib/dream-analyzer.ts` (lines 179-185)
**Severity:** CRITICAL  
**Issue:** Despite having a Supabase Edge Function proxy, the code still contains fallback logic that calls Anthropic API directly from the browser, exposing API keys.

```typescript
// DANGEROUS - Direct API call from client
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': apiKey,  // EXPOSED TO BROWSER
    'anthropic-dangerous-direct-browser-access': 'true',  // RED FLAG
  },
});
```

**Impact:** API key exposure, potential billing fraud, rate limit abuse.

**Fix Required:**
- Remove direct Anthropic fallback completely
- All AI calls must go through Supabase Edge Functions only
- Remove `VITE_ANTHROPIC_API_KEY` from environment variables

### 3. **API Keys Passed as Function Parameters**
**Files:** `src/lib/videoGen.ts`, `src/lib/wearables.ts`
**Severity:** HIGH
**Issue:** Multiple functions accept API keys as parameters, encouraging developers to pass secrets in client-side code.

```typescript
// videoGen.ts line 61
export async function generateDreamVideo(prompt: string, apiKey: string, ...)

// wearables.ts line 41  
export interface WearableAuth {
  accessToken: string;  // Passed around in client code
}
```

**Impact:** API keys may leak through logs, network inspection, or version control.

**Fix Required:**
- Proxy all third-party API calls through backend/edge functions
- Never pass API keys in client-side function parameters
- Use server-side token exchange for OAuth flows

### 4. **Weak Password Validation**
**File:** `src/components/auth/LoginScreen.tsx` (line 31)
**Severity:** MEDIUM-HIGH
**Issue:** Minimum password length of 6 characters is insufficient.

```typescript
if (password.length < 6) {  // TOO WEAK
  setError('Password must be at least 6 characters.');
}
```

**Impact:** Users can set easily brute-forced passwords.

**Fix Required:**
- Minimum 12 characters
- Require mixed case, numbers, and special characters
- Implement password strength meter
- Add breach detection (HaveIBeenPwned API)

### 5. **No CSRF Protection**
**Severity:** HIGH
**Issue:** No CSRF tokens implemented for state-changing operations.

**Impact:** Cross-site request forgery attacks possible.

**Fix Required:**
- Implement SameSite cookies
- Add CSRF tokens for all mutations
- Use double-submit cookie pattern

### 6. **Sensitive Data in localStorage**
**Files:** Multiple files use localStorage for sensitive data
**Severity:** HIGH
**Issue:** Wallet seeds, NFT data, and analytics stored unencrypted (or weakly encrypted) in localStorage.

**Impact:** XSS attacks can steal all user data.

**Fix Required:**
- Use httpOnly cookies for session data
- Encrypt sensitive data with user-derived keys
- Implement Content Security Policy (CSP)

---

## 🟡 UX BEST PRACTICE ISSUES

### 1. **Excessive Console Logging**
**Count:** 371 console statements across the codebase
**Severity:** MEDIUM
**Issue:** Production code contains excessive debug logging that:
- Exposes internal logic to users
- Impacts performance
- May leak sensitive information

**Fix Required:**
- Implement proper logging levels (debug, info, warn, error)
- Strip debug logs in production builds
- Use a logging service with redaction

### 2. **No Loading States for Async Operations**
**Files:** Multiple API calls lack loading indicators
**Severity:** MEDIUM
**Issue:** Users aren't informed during long-running operations (AI analysis, video generation).

**Fix Required:**
- Add skeleton loaders
- Show progress indicators for long operations
- Implement optimistic UI updates where appropriate

### 3. **Poor Error Messages**
**Severity:** MEDIUM
**Issue:** Generic error messages don't help users understand what went wrong.

**Fix Required:**
- User-friendly error messages
- Actionable recovery steps
- Error tracking with unique IDs

### 4. **No Accessibility (a11y) Implementation**
**Severity:** HIGH
**Issue:** Missing ARIA labels, keyboard navigation, screen reader support.

**Fix Required:**
- Add ARIA labels to all interactive elements
- Implement keyboard navigation
- Test with screen readers
- Ensure color contrast meets WCAG AA standards

### 5. **Missing Rate Limit Feedback**
**File:** `src/lib/api/anthropic.ts` (line 178-181)
**Severity:** MEDIUM
**Issue:** Rate limiting throws errors without informing users about wait times.

**Fix Required:**
- Show countdown timers for rate limits
- Queue requests automatically
- Provide clear messaging about limits

---

## 🟢 CODE QUALITY & REDUNDANCY ISSUES

### 1. **Duplicate Analysis Logic**
**Files:** `src/lib/dream-analyzer.ts` vs `src/lib/api/anthropic.ts`
**Severity:** MEDIUM
**Issue:** Two separate implementations of dream analysis with overlapping functionality.

**Fix Required:**
- Consolidate into single analysis module
- Remove `dream-analyzer.ts` or merge with `anthropic.ts`

### 2. **Massive Single File (DreamJournalApp.tsx)**
**File:** `src/DreamJournalApp.tsx` - 3,184 lines
**Severity:** HIGH
**Issue:** Monolithic component violates single responsibility principle.

**Fix Required:**
- Break into smaller, focused components
- Extract business logic to hooks
- Maximum 300-500 lines per component

### 3. **Redundant Supabase Clients**
**Files:** Multiple files create their own Supabase clients
**Severity:** LOW
**Issue:** `client.ts`, `dreamService.ts`, `analytics-sync.ts` each initialize Supabase.

**Fix Required:**
- Single exported Supabase instance
- Import from central location

### 4. **Unused Environment Variables**
**File:** `.env.example`
**Severity:** LOW
**Issue:** Documents many API keys that shouldn't be client-side.

**Fix Required:**
- Remove client-side API key references
- Document only safe-to-expose variables

### 5. **Inconsistent Error Handling**
**Severity:** MEDIUM
**Issue:** Mix of try-catch, .catch(), and silent failures.

**Fix Required:**
- Standardize error handling pattern
- Use ErrorBoundary components
- Centralized error reporting

### 6. **Magic Numbers**
**Severity:** LOW
**Issue:** Hardcoded values throughout (timeouts, limits, scores).

**Fix Required:**
- Extract to constants file
- Add comments explaining values
- Make configurable where appropriate

---

## 🔧 IMMEDIATE ACTION ITEMS

### Priority 1 (Fix Within 24 Hours)
1. ✅ Remove hardcoded encryption key in nft.ts
2. ✅ Remove direct Anthropic API fallback
3. ✅ Increase password requirements
4. ✅ Audit all localStorage usage

### Priority 2 (Fix Within 1 Week)
5. ✅ Implement proper CSP headers
6. ✅ Add CSRF protection
7. ✅ Consolidate duplicate analysis code
8. ✅ Break up monolithic components

### Priority 3 (Fix Within 1 Month)
9. ✅ Implement comprehensive accessibility
10. ✅ Add proper logging framework
11. ✅ Create API key proxy for all third-party services
12. ✅ Implement proper error boundaries

---

## 📋 RECOMMENDED ARCHITECTURE CHANGES

### Security Architecture
```
Browser → Supabase Edge Functions → Third-Party APIs
         (All secrets here)
```

### Data Flow
```
User Input → Validation → Edge Function → External API → Response → UI
             ↑                                    ↓
         Rate Limit                         Secret Management
         CSRF Check                         (Server-side only)
```

---

## 🛡️ SECURITY CHECKLIST

- [ ] Remove all hardcoded secrets
- [ ] Implement CSP headers
- [ ] Add CSRF protection
- [ ] Enable CORS properly
- [ ] Implement rate limiting server-side
- [ ] Add input sanitization
- [ ] Use parameterized queries (SQL injection prevention)
- [ ] Implement proper session management
- [ ] Add security headers (HSTS, X-Frame-Options, etc.)
- [ ] Conduct penetration testing

---

## Conclusion

The EverDream application has significant security vulnerabilities that must be addressed before production deployment. The most critical issues are the hardcoded encryption key and direct API calls from the browser. These expose users to complete account compromise and financial risk.

**Recommendation:** Do not deploy to production until Priority 1 items are resolved. Consider engaging a security firm for a professional audit before launch.
