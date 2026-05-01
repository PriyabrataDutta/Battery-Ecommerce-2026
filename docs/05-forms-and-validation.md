# Forms & validation

This project uses **react-hook-form** for state and **zod** for schemas.
The pattern is the same everywhere: define a zod schema, infer the TS type
from it, register inputs with `useForm`, submit calls a mutation hook.

## Minimal example

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10, "At least 10 characters"),
});
type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", message: "" },
  });

  const onSubmit = (values: FormValues) => {
    // call api or mutation hook
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("email")} />
      {form.formState.errors.email && <p>{form.formState.errors.email.message}</p>}
      <textarea {...form.register("message")} />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Patterns we use

- **Schema lives next to the form**, in a `lib/schemas.ts` for that page if
  it's a multi-form page (Auth, Checkout).
- **Default values are always defined** — never let RHF infer them from
  inputs, or you'll get hydration warnings on selects.
- **Submit triggers a mutation hook** — never call `supabase.from(...)` from
  inside `onSubmit`. The mutation hook handles invalidation + toast.
- **Server errors** are caught in the mutation's `onError`, which fires a
  toast with `useToast()`. Per-field errors come from the zod schema, not
  from the server.

## The shadcn `<Form />` wrapper

For nicer field markup we use `src/components/ui/form.tsx`:

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

This gets you label/description/error markup with one line per field.

## Validation snippets to reuse

Inside `src/pages/checkout/lib/validation.ts` you'll find:

- `SAFE_TEXT` — Unicode-friendly regex for names and addresses
- `GSTIN_REGEX` — Indian GST number format
- `phoneE164` schema — phone with country code

Copy from there rather than reinventing.
