# Styling

## Tailwind, but only through tokens

The design system is in `src/index.css` (CSS variables) and
`tailwind.config.ts` (token names). Components must use semantic classes:

- Good: `bg-background text-foreground border-border`
- Good: `bg-primary text-primary-foreground hover:bg-primary/90`
- Bad: `bg-white text-black` — bypasses dark mode and theming.
- Bad: `text-[#ff0000]` — magic hex, breaks brand updates.

If you need a new color, add it to both files. Use HSL.

## The `ui/` library

`src/components/ui/*` contains shadcn primitives. They're customizable but
treat them as a vendor library:

- Wrap them in your own component if you need a project-specific variant.
- Use `cva` (class-variance-authority) for variants — see `button.tsx`.
- Don't fork a primitive into a one-off; add a variant.

## Layout helpers

- `container-x` (defined in `index.css`) — page horizontal padding + max
  width. Every page should start with `<div className="container-x">`.
- Use the `Card` primitive for any panel/box rather than re-implementing
  borders + shadows.

## Animation

Framer Motion is available. Use sparingly:

- One hero-level entrance per page is plenty.
- Hover micro-interactions belong on the primitive (button, card), not
  re-implemented per usage.
