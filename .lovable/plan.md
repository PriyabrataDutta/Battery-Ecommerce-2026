
## Overview

The current Settings page is a raw key-value editor. We will replace it with a structured, tabbed settings panel with 5 sub-tabs. Each tab saves its config as a typed JSON value in the existing `site_settings` table (one row per setting group). The checkout and order flows will read these settings at runtime so changes take effect immediately.

---

## Sub-Tabs

### 1. Payment Gateway Setup

Lets the admin choose **one active gateway** from Razorpay, PayU, or Cashfree and enter that gateway's credentials.

**UI**: Radio card selector for gateway + credential fields (Key ID, Key Secret, Merchant ID where applicable) + Test/Live mode toggle + "Save" button.

**Storage key**: `payment_gateway` in `site_settings`.

**Impact on checkout**: The Payment step in checkout will read this setting. If no gateway is configured, only COD is shown. The actual payment integration (redirect/SDK) will be stubbed with a placeholder — real gateway SDKs can be wired later since each requires its own Edge Function for server-side verification. For now the admin can configure and save credentials, and the checkout UI will reflect the selected gateway's branding and name.

### 2. Email / SMTP Configuration

Lets the admin configure outbound SMTP so transactional emails (order confirmation, password reset) can be sent.

**UI**: Form fields for SMTP Host, Port, Username, Password, From Name, From Email, Encryption (TLS/SSL/None) + a "Send Test Email" button.

**Storage key**: `smtp_config` in `site_settings`.  
SMTP password will be stored as a secret via the secrets tool (not in the DB). The DB row stores everything except the password, plus a flag `password_set: true/false`.

**"Send Test Email"**: An Edge Function `send-test-email` will use the saved SMTP config + secret to send a test email to the admin's address and return success/failure.

### 3. Notification Settings

Comprehensive notification preferences split into two categories:

**Staff Notifications** (Super Admin, Admin, Staff):
- New order placed
- Order status changes (confirmed, shipped, delivered, cancelled)
- New customer registration
- New quote request
- New contact message / callback request
- Low stock alert
- Payment received / failed

**Customer Notifications**:
- Order confirmation
- Order shipped
- Order delivered
- Order cancelled/refunded
- Account creation welcome
- Quote response ready

**UI**: Two-column table with toggle switches. Rows = event types, columns = recipient roles. Each toggle enables/disables that notification for that role.

**Storage key**: `notification_settings` in `site_settings` — a JSON object like `{ "new_order": { "super_admin": true, "admin": true, "staff": false, "customer": true }, ... }`.

**Impact**: This is a configuration layer. Actual email sending will check these toggles before dispatching. The setting is read-only for now (no email dispatch yet), but the structure is ready for when SMTP or Lovable Emails are wired in.

### 4. GST Settings

Replaces the hardcoded `TAX_RATE = 0.18` in `src/pages/checkout/lib/constants.ts`.

**UI**: 
- GST Rate (%) — default 18
- GSTIN (business's own GST number)
- Business Legal Name
- State (for determining CGST+SGST vs IGST)
- Toggle: Show GST breakup on invoice (CGST/SGST split vs single GST line)

**Storage key**: `gst_settings` in `site_settings`.

**Impact on checkout**: `calcTax()` in `src/pages/checkout/lib/totals.ts` will be updated to read the GST rate from a React Query cache of this setting instead of the hardcoded constant. The Cart summary will also reflect the dynamic rate. A hook `useGstSettings()` will be created to fetch and cache this.

### 5. Shipping Cost Settings

Replaces the hardcoded delivery prices in `DELIVERY_OPTIONS` in `src/pages/checkout/lib/constants.ts`.

**UI**: Editable table/cards for each delivery method:
- Standard Delivery — price, ETA text
- Express Delivery — price, ETA text  
- Installation Delivery — price, ETA text
- Free shipping threshold (orders above ₹X get free standard shipping)

**Storage key**: `shipping_settings` in `site_settings`.

**Impact on checkout**: `DELIVERY_OPTIONS` will be replaced by a hook `useShippingSettings()` that merges DB values with defaults. The Cart page's "FREE" shipping label will check the threshold setting.

---

## Technical Plan

### Database
No schema changes needed — everything uses the existing `site_settings` key-value table. One new Edge Function for SMTP test email + one secret for SMTP password.

### New Files
| File | Purpose |
|------|---------|
| `src/pages/admin/settings/index.tsx` | Rewrite — tabbed layout with 5 sub-tabs + the existing raw settings as a 6th "Advanced" tab |
| `src/pages/admin/settings/tabs/PaymentGatewayTab.tsx` | Payment gateway config UI |
| `src/pages/admin/settings/tabs/EmailSmtpTab.tsx` | SMTP config UI |
| `src/pages/admin/settings/tabs/NotificationsTab.tsx` | Notification toggles grid |
| `src/pages/admin/settings/tabs/GstTab.tsx` | GST config UI |
| `src/pages/admin/settings/tabs/ShippingTab.tsx` | Shipping cost config UI |
| `src/hooks/useGstSettings.ts` | Fetches `gst_settings` for checkout |
| `src/hooks/useShippingSettings.ts` | Fetches `shipping_settings` for checkout |
| `supabase/functions/send-test-email/index.ts` | Edge Function for SMTP test |

### Modified Files
| File | Change |
|------|--------|
| `src/pages/checkout/lib/totals.ts` | Use dynamic GST rate from settings |
| `src/pages/checkout/lib/constants.ts` | Remove hardcoded `TAX_RATE`; make `DELIVERY_OPTIONS` a fallback default |
| `src/pages/Cart.tsx` | Use dynamic shipping threshold |
| `src/pages/checkout/index.tsx` | Wire dynamic delivery options + payment gateway |

### Approach
- Each tab auto-loads its setting key on mount and saves on "Save" click via the existing `upsertSetting()` API
- All settings have sensible defaults so the app works even before anything is configured
- The existing raw key-value editor moves to an "Advanced" sub-tab so power users can still access it
- SMTP password is stored as a Supabase secret, never exposed in the frontend
