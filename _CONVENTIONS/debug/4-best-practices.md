# Debug Logging Best Practices

For debug logging conventions, see [Debug Logging](./2-debug-logging.md). For error/warning logging, Sentry, and security rules, see [Error Handling Conventions](../error-handling/1-START-HERE.md).

## Performance

- **Gate expensive construction** — `debug` skips formatting when disabled, but avoid building complex context objects just for debug output
- **Never debug-log inside tight loops** — log a summary after, not each iteration

## Anti-Patterns

| Anti-Pattern     | Problem                                           | Fix                                                  |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------- |
| **The Flood**    | Debug logging inside `Array.map()` over 500 items | Log a summary after the loop                         |
| **The Orphan**   | Entry `->` without exit `<-`                      | Always pair entry/exit                                |
| **The Leftover** | `console.log("HERE")` in production               | Use `debug()` for tracing; never commit `console.log` |

## Consistency

- **Never use `console.log`** for permanent logging — `debug()` for tracing, `console.warn`/`console.error` for production
- Keep messages **under 80 characters** — detail belongs in context objects
