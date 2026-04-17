# Injection & Input Validation

Covers **OWASP A03 (Injection)** and **A10 (SSRF)**. Every path where external data enters the system is an injection surface.

---

## Cross-Site Scripting (XSS)

**Severity: High**

### What to Check

- User-supplied strings rendered in React components without escaping
- `dangerouslySetInnerHTML` usage — **flag every instance**
- URL construction from user input (javascript: protocol, data: URIs)
- Dynamic `href`, `src`, or `action` attributes built from request data
- Server-rendered HTML outside React (email templates, PDF generation)

### Codebase Context

React auto-escapes JSX interpolation (`{value}`) — the primary XSS risk is **escape hatches** and **non-React rendering pipelines**.

```typescript
// ❌ XSS — unsanitised HTML injection
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ XSS — javascript: protocol in href
<a href={userProvidedUrl}>Link</a>

// ✅ Safe — React auto-escapes
<p>{userInput}</p>

// ✅ Safe — URL validation before render
const safeUrl = isValidHttpUrl(userProvidedUrl) ? userProvidedUrl : "#";
<a href={safeUrl}>Link</a>
```

### Checklist

- [ ] No `dangerouslySetInnerHTML` with user-controlled content
- [ ] All dynamic URLs validated against an allowlist or protocol check (`https:` only)
- [ ] Email templates use parameterised fields, never string concatenation with user input
- [ ] Typst templates use `escapeTypst()` for all user-supplied values
- [ ] No user input passed to `eval()`, `Function()`, or `new Function()`

---

## SQL Injection

**Severity: Critical**

### What to Check

- Raw SQL queries with string interpolation or concatenation
- Supabase `.rpc()` calls passing unsanitised user input to database functions
- Custom query builders that don't use parameterised queries
- Dynamic column/table names constructed from user input

### Codebase Context

Supabase JS client uses **parameterised queries by default** — the primary risk is escaping into raw SQL via `.rpc()` or `.textSearch()` with user-controlled values.

```typescript
// ❌ SQL injection — string interpolation in RPC
await supabase.rpc("search_items", { query: `%${userInput}%` });

// ❌ SQL injection — dynamic column name
await supabase.from("table").select(userInput);

// ✅ Safe — parameterised via Supabase client
await supabase.from("assignments").select("*").eq("id", assignmentId);

// ✅ Safe — Zod-validated input before query
const { data } = validateRequestBody(body, schema);
await supabase.from("classes").insert(data);
```

### Checklist

- [ ] No string interpolation in `.rpc()` arguments
- [ ] No user input in `.select()` column specifications
- [ ] No dynamic table/schema names from request data
- [ ] All query parameters go through Zod validation first
- [ ] Supabase `.textSearch()` input is sanitised (no raw `tsquery` operators)

---

## Command Injection

**Severity: Critical**

### What to Check

- `child_process.exec()`, `execSync()`, `spawn()` with user-controlled arguments
- Shell commands constructed from request parameters
- File paths built from user input without sanitisation

### Codebase Context

No shell commands in the main application — risk surfaces if **build scripts, PDF generation, or file processing** accept user input.

```typescript
// ❌ Command injection — user input in shell command
exec(`convert ${uploadedFilePath} output.pdf`);

// ❌ Path traversal — unsanitised filename
const path = `uploads/${userFilename}`;

// ✅ Safe — sanitised filename
const safeName = sanitizeFilename(userFilename);
const path = `uploads/${userId}/${safeName}`;
```

### Checklist

- [ ] No `exec()`, `execSync()`, or `spawn()` with user-controlled arguments
- [ ] All file paths use `sanitizeFilename()` for user-supplied names
- [ ] Storage paths enforce the `{userId}/{resourceId}/` prefix structure
- [ ] No user input passed to `require()` or dynamic `import()`

---

## Server-Side Request Forgery (SSRF)

**Severity: High**

### What to Check

- `fetch()` or `axios` calls where the URL includes user-controlled input
- Webhook URLs, callback URLs, or redirect URLs from request data
- Image/document URLs fetched server-side for processing

### Codebase Context

The primary SSRF surface is **AI agent integrations** (fetching external content) and **file processing** (document URLs).

```typescript
// ❌ SSRF — user controls the URL
const response = await fetch(req.body.webhookUrl);

// ❌ SSRF — open redirect via user-controlled path
return NextResponse.redirect(req.query.returnTo);

// ✅ Safe — URL from trusted configuration
const response = await fetch(process.env.AI_ENDPOINT);

// ✅ Safe — redirect to known internal path
const returnPath = ALLOWED_REDIRECTS.includes(returnTo) ? returnTo : "/";
return NextResponse.redirect(new URL(returnPath, request.url));
```

### Checklist

- [ ] No server-side `fetch()` with user-controlled URLs
- [ ] Redirect targets validated against an allowlist
- [ ] Webhook/callback URLs restricted to HTTPS with domain validation
- [ ] Internal service URLs never exposed or controllable by users
- [ ] No user input in Supabase storage signed URL generation paths

---

## Template Injection

**Severity: High**

### What to Check

- Typst template rendering with user-supplied content
- Email template construction with string interpolation
- Any server-side template engine receiving user data

### Codebase Context

Typst PDF generation is a key injection surface — raw user text can execute Typst commands if not escaped.

```typescript
// ❌ Template injection — raw user input in Typst
const typst = `#text("${studentName}")`;

// ✅ Safe — escaped user input
const typst = `#text("${escapeTypst(studentName)}")`;
```

### Checklist

- [ ] All user-supplied values in Typst templates pass through `escapeTypst()`
- [ ] Email templates use parameterised placeholders, not string concatenation
- [ ] No user input in `eval()`, template literals used as code, or dynamic regex construction
- [ ] Markdown rendering (if any) sanitises HTML output

---

## XML External Entity (XXE)

**Severity: High**

### What to Check

- XML parsing of uploaded documents (DOCX files are ZIP archives containing XML)
- Any `DOMParser`, `xml2js`, or similar XML processing library
- SVG uploads processed server-side

### Codebase Context

DOCX upload support means XML parsing is in the attack surface. Ensure XML parsers **disable external entity resolution**.

### Checklist

- [ ] XML parsers configured with `{ noent: false, dtd: false }` or equivalent
- [ ] DOCX processing libraries are up-to-date and don't resolve external entities
- [ ] SVG uploads (if supported) are sanitised or converted to raster before serving
- [ ] No custom XML parsing with `eval()` or string-based processing

---

## Input Validation Rules

Every external input must be validated at the **system boundary** (API route) before reaching business logic.

| Input Source     | Validation Method             | Location                  |
| ---------------- | ----------------------------- | ------------------------- |
| Request body     | `validateRequestBody()` + Zod | API route handler         |
| Query parameters | Zod schema on parsed params   | API route handler         |
| URL path params  | Zod UUID/string validation    | API route handler         |
| File uploads     | MIME whitelist + size limit   | Upload validation utility |
| Webhook payloads | Signature verification + Zod  | Webhook route handler     |
| Environment vars | Validated at startup          | Config module             |

### Validation Anti-Patterns

| Anti-Pattern                         | Fix                                                    |
| ------------------------------------ | ------------------------------------------------------ |
| Validating in service layer          | Move to API route — services trust their inputs        |
| `.parse()` instead of `.safeParse()` | Use `validateRequestBody()` which uses `.safeParse()`  |
| Regex-only validation                | Use Zod schemas — composable, typed, self-documenting  |
| Trusting `Content-Type` header       | Validate actual file content, not just the MIME header |
| Allowing `*` in CORS for auth routes | Explicit origin allowlist                              |
