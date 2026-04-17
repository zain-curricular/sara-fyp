# Forms & Dialogs

## Dialog Forms

Forms inside dialogs use shadcn `Dialog` + `Field` primitives with react-hook-form.

```typescript
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-auto">
        <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Context</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Sections */}
            <DialogFooter className="mt-6">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create"}
                </Button>
            </DialogFooter>
        </form>
    </DialogContent>
</Dialog>
```

- `max-h-[80vh] overflow-auto` for scrollable content
- `gap-6` between form sections
- `DialogFooter` with `mt-6` inside the `<form>` tag

## Form Sections

Split forms into titled sections with separators:

```typescript
<div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
        <h3 className="text-xs font-medium text-muted-foreground">
            Section Title
        </h3>
        <Separator />
    </div>

    {/* Fields */}
</div>
```

Side-by-side fields within a section use `grid grid-cols-2 gap-3`.

## Field Pattern

Every form field uses the `Field` wrapper:

```typescript
<Field data-invalid={!!error || undefined}>
    <Label htmlFor="field_name">Label</Label>
    <Input id="field_name" placeholder="..." {...form.register("field_name")} />
    <FieldDescription>Helper text</FieldDescription>
    {error && <FieldError>{error.message}</FieldError>}
</Field>
```

- `data-invalid` triggers red styling (not a className)
- `Label` always has `htmlFor` matching the input `id`
- `FieldDescription` below the input, `FieldError` below description

## Select Fields

Use `Controller` from react-hook-form to bridge shadcn `Select`:

```typescript
<Controller
    control={form.control}
    name="field_name"
    render={({ field }) => (
        <Field data-invalid={!!errors.field_name || undefined}>
            <Label htmlFor="field_name">Label</Label>
            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <SelectTrigger id="field_name" className="w-full">
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </Field>
    )}
/>
```

For forms with many selects, extract a local `FormSelect` helper to reduce repetition.

## Async Submission

```typescript
const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
});
```

- `form.handleSubmit` runs Zod validation before calling the handler
- All buttons disabled during submission (`disabled={isSubmitting}`)
- Button text changes to reflect loading state (e.g. `"Creating..."`)
- No spinners — text change is the loading indicator
