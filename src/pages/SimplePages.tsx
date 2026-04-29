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
      <p>Call <a href="tel:+919999999999" className="text-primary font-semibold">+91 99999 99999</a> or <a href="https://wa.me/919999999999" className="text-primary font-semibold">WhatsApp us</a> for immediate assistance.</p>
    </>
  } />
);

export const Catalog = () => (
  <SimplePage title="Catalogs & Price Lists" body={<p>PDF downloads coming soon. Contact us for current price lists.</p>} />
);

export const Blog = () => (
  <SimplePage title="Blog & Resources" body={<p>Articles, guides and battery tips — coming soon.</p>} />
);
