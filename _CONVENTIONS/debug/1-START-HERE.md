# Observability Conventions

This covers **debug logging** — development tracing via the `debug` npm package. For error/warning logging (`console.error`/`console.warn`) and Sentry error reporting, see the [Error Handling Conventions](../error-handling/1-START-HERE.md).

## Debug Logging

| System         | Package             | Visibility                           | Purpose                                                    |
| -------------- | ------------------- | ------------------------------------ | ---------------------------------------------------------- |
| **Debug logs** | `debug` npm package | Off by default, opt-in per namespace | Development tracing, flow diagnostics, performance metrics |

## Enabling Debug Logs

```bash
DEBUG=curricular:* npm run dev          # Server — all namespaces
DEBUG=curricular:assignments npm run dev # Server — one namespace
localStorage.debug = 'curricular:*'     # Browser — DevTools console
```

## Infrastructure

| Utility    | Location             | Purpose                                       |
| ---------- | -------------------- | --------------------------------------------- |
| `debug.ts` | `lib/utils/debug.ts` | Pre-configured debug loggers per feature area |

Files: [Debug Logging](./2-debug-logging.md) → [Best Practices](./4-best-practices.md)
