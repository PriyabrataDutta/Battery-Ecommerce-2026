const SimplePage = ({ title, body }: { title: string; body: React.ReactNode }) => (
  <div className="container-x py-12 max-w-3xl">
    <h1 className="font-display-tight text-4xl font-bold">{title}</h1>
    <div className="prose prose-sm max-w-none mt-6 text-ink-soft">{body}</div>
  </div>
);

export const About = () => (
  <SimplePage title="About Kachi Batteries" body={
    <>
      <p>Kachi Batteries is India's trusted source for genuine car batteries, inverter batteries and UPS systems. We work directly with manufacturers like Amaron, Exide, Power Zone and Elito to deliver authentic products at competitive prices.</p>
      <p>With same-day dispatch in major cities and free professional installation, we make sourcing reliable power simple — for homeowners, businesses and B2B partners alike.</p>
    </>
  } />
);

export const JumpStart = () => (
  <SimplePage title="Car Jump Start Service" body={
    <>
      <p>Stranded with a dead battery? Our mobile technicians offer fast jump-start service across major Indian cities — usually within 30-45 minutes.</p>
      <p>Call <a href="tel:+918197568707" className="text-primary font-semibold">+91 81975 68707</a> or <a href="https://wa.me/918197568707" className="text-primary font-semibold">WhatsApp us</a> for immediate assistance.</p>
    </>
  } />
);

export const Catalog = () => (
  <SimplePage title="Catalogs & Price Lists" body={<p>PDF downloads coming soon. Contact us for current price lists.</p>} />
);

export const Blog = () => (
  <SimplePage title="Blog & Resources" body={<p>Articles, guides and battery tips — coming soon.</p>} />
);

const UPDATED = "19 November 2026";
const Email = () => <a href="mailto:kachibatteries@gmail.com" className="text-primary font-semibold">kachibatteries@gmail.com</a>;

export const PrivacyPolicy = () => (
  <SimplePage title="Privacy Policy" body={
    <>
      <p><em>Last updated: {UPDATED}</em></p>
      <p>This policy explains how Kachi Batteries ("we", "us") collects, uses and protects your personal data when you use www.kachibatteries.com, in line with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.</p>

      <h2>Data we collect</h2>
      <ul>
        <li><strong>Account details:</strong> name, email address, mobile number and password (stored only as a secure hash). If you sign in with Google, we receive your name and email from Google.</li>
        <li><strong>Order details:</strong> delivery and billing addresses, products ordered, delivery slot, vehicle details you enter to find a battery, and order notes.</li>
        <li><strong>Payment details:</strong> online payments are processed by Cashfree Payments. We never see or store your card, UPI or bank login details; we receive only the payment status and reference number.</li>
        <li><strong>Messages:</strong> anything you send us through contact, quote, callback, return or review forms, including photos you upload.</li>
        <li><strong>Technical data:</strong> IP address, browser type and security logs used to prevent fraud and abuse.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and install your order, and to provide warranty and return support.</li>
        <li>To send order updates, invoices and account emails or messages.</li>
        <li>To keep your account secure, prevent fraud and comply with tax (GST) and other legal obligations.</li>
        <li>To answer your questions and improve our website.</li>
      </ul>
      <p>We do not sell your personal data. We do not send marketing messages without your consent.</p>

      <h2>Who we share it with</h2>
      <p>Only with service providers who help us run the store, and only as needed: Cashfree Payments (payments), Supabase (secure database and sign-in hosting), Vercel and Cloudflare (website hosting and security), Resend (transactional email), Google (sign-in, if you choose it), and our delivery and installation partners (name, phone and address for your order). We may also disclose data when required by law or a government authority.</p>

      <h2>Cookies and local storage</h2>
      <p>We use your browser's storage to keep you signed in and to remember your cart. We use Cloudflare Turnstile to protect sign-up and login from bots. We do not use advertising cookies.</p>

      <h2>How long we keep it</h2>
      <p>We keep account data while your account is active. Order and invoice records are kept for the period required by GST and accounting laws, even if you close your account. Other data is deleted or anonymised when no longer needed.</p>

      <h2>Your rights</h2>
      <p>You can view and update your profile and addresses in My Account. You can also ask us to access, correct or erase your personal data, withdraw consent, or nominate another person to exercise these rights on your behalf, by emailing <Email />. We respond within 30 days.</p>

      <h2>Security</h2>
      <p>Data is encrypted in transit (HTTPS), access is restricted by role, and staff accounts require two-factor authentication. No system is perfectly secure, but we take reasonable measures to protect your data and will notify you and the authorities of a breach as required by law.</p>

      <h2>Children</h2>
      <p>Our store is meant for adults. We do not knowingly collect data from children under 18.</p>

      <h2>Grievance Officer</h2>
      <p>For any privacy concern or complaint, contact our Grievance Officer at <Email /> or through the <a href="/contact" className="text-primary font-semibold">Contact page</a>. We acknowledge complaints within 48 hours and resolve them within 30 days.</p>

      <h2>Changes</h2>
      <p>We may update this policy. The date at the top shows the latest version.</p>
    </>
  } />
);

export const RefundPolicy = () => (
  <SimplePage title="Return & Refund Policy" body={
    <>
      <p><em>Last updated: {UPDATED}</em></p>

      <h2>Cancellations</h2>
      <ul>
        <li>You can cancel an order free of charge any time before it is dispatched. Contact us with your order number.</li>
        <li>Unpaid online orders are cancelled automatically if payment is not completed within 30 minutes.</li>
        <li>Once an order has been dispatched it cannot be cancelled, but you may refuse delivery or request a return as below.</li>
      </ul>

      <h2>Returns</h2>
      <p>We accept returns within <strong>7 days of delivery</strong> if:</p>
      <ul>
        <li>you received the wrong product, or it was damaged in transit (please report transit damage within 48 hours of delivery, with photos); or</li>
        <li>the battery is unused, not installed, and in its original packaging with all accessories and the invoice.</li>
      </ul>
      <p>Batteries that have been installed, charged in a vehicle or inverter, or physically damaged after delivery cannot be returned. A manufacturing defect found after installation is handled under the manufacturer's warranty (see below).</p>

      <h2>Old battery exchange</h2>
      <p>If you chose the exchange price, the old battery collected at delivery is disposed of as required by the Battery Waste Management Rules, 2022 and cannot be given back. If you return the new battery, the exchange discount is adjusted in your refund, or we refund the difference you paid for not exchanging.</p>

      <h2>Warranty claims</h2>
      <p>Every battery carries the manufacturer's warranty for the period shown on the product page. Warranty claims are inspected and decided by the brand's authorised service centre. We will help you raise the claim; replacement or repair under warranty follows the manufacturer's terms.</p>

      <h2>How to request a return</h2>
      <p>Email <Email /> or use the <a href="/contact" className="text-primary font-semibold">Contact page</a> with your order number, the reason, and photos of the product and packaging. Our team will verify the request and arrange pickup at no cost to you if it is approved.</p>

      <h2>Refunds</h2>
      <ul>
        <li>Approved refunds are initiated within <strong>2 working days</strong> after we receive and inspect the returned product, or immediately for a cancelled prepaid order.</li>
        <li>Online payments are refunded to the original payment method through Cashfree Payments. The amount usually reaches your account within <strong>5–7 working days</strong>, depending on your bank.</li>
        <li>Cash on Delivery orders are refunded by bank transfer or UPI to an account you provide.</li>
        <li>The full amount paid, including GST, is refunded. Express delivery or installation charges are refunded if the service was not provided or the return is due to our error.</li>
      </ul>

      <h2>Contact</h2>
      <p>Questions about a return or refund? Email <Email />. We reply within 1 working day.</p>
    </>
  } />
);
