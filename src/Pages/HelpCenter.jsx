import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaQuestionCircle,
  FaHeadset,
  FaCommentAlt,
  FaChevronDown,
  FaEnvelope,
} from "react-icons/fa";
import DocumentHeader from "../Components/DocumentHeader";
import "../Styles/HelpCenter.css";

export default function HelpCenter() {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    {
      q: "How do I book a room?",
      a: "Search by city or landmark, pick a verified listing, check availability and click 'Book'. You will receive confirmation and owner contact once booking is completed.",
    },
    {
      q: "How do I report a listing or user?",
      a: "Open the listing page, click 'Report' and follow the prompts. Our safety team will investigate immediately.",
    },
    {
      q: "What payment methods are accepted?",
      a: "Roomify supports UPI, major debit/credit cards, and secure bank transfers where applicable. Always verify the payment flow on the booking page.",
    },
    {
      q: "How long does verification take for hosts?",
      a: "Host verification typically takes 24–72 hours depending on submitted documents and local checks.",
    },
  ];

  const featured = [
    {
      icon: <FaQuestionCircle />,
      title: "Booking & Payments",
      desc: "Step-by-step guide for booking, payment safety and refund rules.",
      link: "/help/booking",
    },
    {
      icon: <FaHeadset />,
      title: "Support & Safety",
      desc: "How to contact safety support, emergency steps and reporting.",
      link: "/help/safety",
    },
    {
      icon: <FaCommentAlt />,
      title: "Host Guidelines",
      desc: "Best practices for owners to keep listings trustworthy and accurate.",
      link: "/help/hosts",
    },
  ];

  return (
    <>
      <DocumentHeader />
      <div className="helpPageWrap">
        {/* HERO */}
        <motion.header
          className="helpHero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="heroInner">
            <div className="heroLeft">
              <h1>Help Center</h1>
              <p className="heroSub">
                Find quick answers, guides and support. If you can't find what
                you're looking for, contact our team — we're available 24/7.
              </p>
              <div
                className="searchBlock"
                role="search"
                aria-label="Help search"
              >
                <input
                  className="helpSearch"
                  type="search"
                  placeholder="Search help articles, topics, or errors"
                  aria-label="Search help"
                />
                <button className="btn btn-primary">Search</button>
              </div>
            </div>

            <div className="heroRight" aria-hidden>
              <div className="supportCard">
                <div className="supportIcon">
                  <FaHeadset />
                </div>
                <div className="supportContent">
                  <h3>Need live help?</h3>
                  <p>
                    Contact our support team — available 24/7 for urgent issues.
                  </p>
                  <a href="/contact" className="btn btn-ghost contactBtn">
                    <FaEnvelope style={{ marginRight: 8 }} /> Contact Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* FEATURE ROW */}
        <section className="helpFeatures">
          <div className="container">
            <motion.div
              className="featuresGrid"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {},
              }}
            >
              {featured.map((f, i) => (
                <motion.a
                  href={f.link}
                  className="featureCard"
                  key={i}
                  whileHover={{ translateY: -6 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                >
                  <div className="featureIcon">{f.icon}</div>
                  <div className="featureText">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="helpFAQ container">
          <h2 className="sectionTitle">Frequently Asked Questions</h2>

          <div className="faqGrid">
            <div className="faqList">
              {faqs.map((f, idx) => {
                const open = openIndex === idx;
                return (
                  <motion.div
                    className="faqItem"
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <button
                      className="faqQ"
                      aria-expanded={open}
                      onClick={() => setOpenIndex(open ? null : idx)}
                    >
                      <span>{f.q}</span>
                      <FaChevronDown className={`chev ${open ? "rot" : ""}`} />
                    </button>

                    <motion.div
                      className="faqA"
                      initial={{ height: 0, opacity: 0 }}
                      animate={
                        open
                          ? { height: "auto", opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.28 }}
                    >
                      <p>{f.a}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* SIDEBAR */}
            <aside className="helpSidebar">
              <div className="sidebarCard">
                <h3>Popular Help</h3>
                <ul className="linkList">
                  <li>
                    <a href="/help/booking">Booking guide</a>
                  </li>
                  <li>
                    <a href="/help/payments">Payments & refunds</a>
                  </li>
                  <li>
                    <a href="/help/verification">Verification process</a>
                  </li>
                  <li>
                    <a href="/safety">Safety information</a>
                  </li>
                </ul>
              </div>

              <div className="sidebarCard smallCard">
                <h4>Still need help?</h4>
                <p>
                  Start a chat or email our support team. We usually reply
                  within an hour.
                </p>
                <a className="btn btn-primary" href="/contact">
                  Get Support
                </a>
              </div>
            </aside>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="helpCTA">
          <div className="container">
            <motion.div
              className="ctaInner"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div>
                <h3>Can't find what you need?</h3>
                <p>
                  Reach out and our team will guide you through the process
                  step-by-step.
                </p>
              </div>
              <a className="btn btn-primary" href="/contact">
                Contact Support
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
