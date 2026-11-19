/** Home-power battery categories shown in the inverter shop, with buyer-friendly notes. */
export const INVERTER_KINDS = [
  { slug: "tubular", label: "Tubular", note: "Longest life on frequent power cuts. Needs a water top-up every few months." },
  { slug: "smf", label: "SMF / VRLA", note: "Sealed and maintenance-free. Good for flats and light backup." },
  { slug: "lithium", label: "Lithium", note: "Lightest, charges fastest, lasts the most cycles. Higher upfront price." },
  { slug: "inverter-ups", label: "Inverter & UPS", note: "Inverters, home UPS units and combos." },
] as const;

export const INVERTER_SLUGS = INVERTER_KINDS.map((k) => k.slug);
