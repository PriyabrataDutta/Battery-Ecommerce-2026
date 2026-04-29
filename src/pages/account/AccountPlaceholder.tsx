import { ReactNode } from "react";

interface PlaceholderProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

const AccountPlaceholder = ({ title, description, icon }: PlaceholderProps) => (
  <section className="bg-white border border-line p-8">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h2 className="font-display-tight text-2xl font-bold">{title}</h2>
    </div>
    <p className="text-sm text-muted-foreground max-w-prose">{description}</p>
    <div className="mt-6 border border-dashed border-line p-8 text-center text-sm text-muted-foreground">
      Coming soon.
    </div>
  </section>
);

export const AccountWishlist = () => (
  <AccountPlaceholder
    title="Wishlist"
    description="Save products you're considering and revisit them later. Items you bookmark will appear here."
  />
);

export const AccountQuotes = () => (
  <AccountPlaceholder
    title="Quote Requests"
    description="Track the status of bulk and B2B quote requests you've submitted to our sales team."
  />
);

export const AccountSupport = () => (
  <AccountPlaceholder
    title="Support"
    description="Review your contact messages and callback requests, and start a new conversation with our team."
  />
);

export default AccountPlaceholder;
