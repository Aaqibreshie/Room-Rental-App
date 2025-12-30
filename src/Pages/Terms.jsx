import DocumentHeader from "../Components/DocumentHeader";
import "../Styles/Terms.css";

export default function Terms() {
  return (
    <>
      <DocumentHeader
        title="Terms & Conditions"
        subtitle="How Roomify works and what to expect"
      />

      <div className="legalPage">
        {/* HERO */}
        <section className="legalHero">
          <div className="legalHeroBadge">Legal</div>
          <h1>Terms & Conditions</h1>
          <p className="legalMeta">Last updated · 20 December 2025</p>
          <p className="legalIntro">
            These terms explain your rights and responsibilities when using
            Roomify to find or list rooms. Please read them carefully before
            using the platform.
          </p>
        </section>

        {/* BODY */}
        <section className="legalBody">
          {/* Left column */}
          <div className="legalMain">
            <article className="legalCard">
              <h2>1. Eligibility</h2>
              <p>
                You must be at least 18 years old to use Roomify. By creating an
                account or using the platform, you confirm that you meet this
                requirement and have the legal capacity to enter into binding
                agreements.
              </p>
            </article>

            <article className="legalCard">
              <h2>2. User accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                login details and for all activity under your account. Notify us
                immediately if you suspect any unauthorised access or security
                breach.
              </p>
            </article>

            <article className="legalCard">
              <h2>3. Listings & bookings</h2>
              <p>
                Roomify acts as an online platform connecting tenants with
                property owners. Unless explicitly stated, Roomify does not own,
                operate or manage listed properties, and does not guarantee the
                accuracy of listings.
              </p>
            </article>

            <article className="legalCard">
              <h2>4. Payments & deposits</h2>
              <p>
                Any rent, fees or security deposits are governed by the
                agreement between the tenant and the property owner. You are
                responsible for reviewing these terms before confirming a
                booking.
              </p>
            </article>

            <article className="legalCard">
              <h2>5. Limitation of liability</h2>
              <p>
                To the maximum extent permitted by law, Roomify is not liable
                for any indirect, incidental, or consequential damages arising
                from your use of the platform, including disputes between users.
              </p>
            </article>
          </div>

          {/* Right column / aside */}
          <aside className="legalAside">
            <div className="legalAsideCard">
              <h3>In short</h3>
              <p>
                Roomify connects people looking for rooms with trusted
                landlords. You remain responsible for your bookings, payments
                and interactions.
              </p>
            </div>

            <div className="legalAsideCard">
              <h3>Need help?</h3>
              <p>
                If something in these terms is unclear, reach out to our support
                team for clarification before you book or list a property.
              </p>
              <a className="legalLink" href="/help">
                Visit Help Center
              </a>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
