import { ContactForm } from '../components/ContactForm';

export default function Page() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">ACME Inc.</p>
        <h1>A Next.js brochure site with a direct contact path.</h1>
        <p>
          This example keeps the structure explicit: the site tells the ACME story, then hands the contact request to
          <code>form-mailer</code> through a Cloudflare Pages function.
        </p>
      </section>

      <section className="card">
        <h2>What ACME Inc. does</h2>
        <p>
          ACME Inc. is a boilerplate company overview for the example workspace. It gives the layout a realistic voice
          without turning the example into product marketing.
        </p>
      </section>

      <section className="card">
        <h2>Contact ACME Inc.</h2>
        <p className="muted">
          The widget below is the real Turnstile integration path. For a test site key and secret, use Cloudflare's
          testing guidance in the docs.
        </p>
        <ContactForm />
      </section>
    </main>
  );
}
