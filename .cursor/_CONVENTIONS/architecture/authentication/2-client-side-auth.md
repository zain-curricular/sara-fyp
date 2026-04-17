# Client-Side Auth

**Never use raw `fetch()` for API calls in client components** — always `useAuthenticatedFetch()` from `src/lib/hooks/useAuthenticatedFetch.ts`. It attaches the Bearer token from `AuthContext` and redirects to `/login` on 401.

```typescript
const authFetch = useAuthenticatedFetch();
const response = await authFetch("/api/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
});
```

- Call the hook once at the top of each component/hook — don't import `useAuth()` to manually build headers
