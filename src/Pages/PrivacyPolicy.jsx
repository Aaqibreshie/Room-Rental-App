import { motion } from "framer-motion";
import "../Styles/PrivacyPolicy.css";
import DocumentHeader from "../Components/DocumentHeader";

export default function PrivacyPolicy() {
  return (
    <>
      <DocumentHeader />
      <div className="privacyContainer">
        {/* HEADER / HERO */}
        <motion.div
          className="privacyHero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Privacy Policy</h1>
          <p>
            Your privacy is important to us. This Privacy Policy explains how
            Roomify collects, uses, and protects your information when you use
            our platform.
          </p>
        </motion.div>

        {/* CONTENT SECTIONS */}
        <div className="privacyContent">
          <motion.section
            className="privacySection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2>1. Information We Collect</h2>
            <p>
              We collect the following types of information to provide and
              improve our services:
            </p>

            <ul>
              <li>
                <strong>Personal Information:</strong> Name, email, phone
                number, and identity documents.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, search activity,
                interactions, device data.
              </li>
              <li>
                <strong>Location Data:</strong> To show relevant listings and
                improve user experience.
              </li>
              <li>
                <strong>Host Information:</strong> Listing details, property
                information, verification documents.
              </li>
            </ul>
          </motion.section>

          <motion.section className="privacySection">
            <h2>2. How We Use Your Information</h2>

            <ul>
              <li>To verify your identity and ensure platform safety.</li>
              <li>To provide accurate room matches and recommendations.</li>
              <li>To enable secure communication between hosts and seekers.</li>
              <li>To prevent fraud, suspicious activity, and misuse.</li>
              <li>To improve the platform through analytics and feedback.</li>
            </ul>
          </motion.section>

          <motion.section className="privacySection">
            <h2>3. Sharing of Information</h2>
            <p>
              Roomify does <strong>not sell</strong> your personal data. We only
              share your information with:
            </p>

            <ul>
              <li>Verified hosts when you interact with their listing.</li>
              <li>
                Service providers who support our platform (servers, security
                tools, analytics).
              </li>
              <li>
                Law enforcement when legally required or for safety reasons.
              </li>
            </ul>
          </motion.section>

          <motion.section className="privacySection">
            <h2>4. Data Protection & Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              data including encryption, identity verification, fraud detection,
              and secure hosting infrastructure.
            </p>
          </motion.section>

          <motion.section className="privacySection">
            <h2>5. Your Rights</h2>

            <ul>
              <li>Access, update, or delete your account information.</li>
              <li>Request a copy of your stored data.</li>
              <li>Withdraw consent for non-essential data collection.</li>
              <li>Request correction of inaccurate information.</li>
            </ul>
          </motion.section>

          <motion.section className="privacySection">
            <h2>6. Cookies & Tracking Technologies</h2>
            <p>
              We use cookies to enhance user experience, remember preferences,
              and improve platform performance. You can disable cookies in your
              browser settings.
            </p>
          </motion.section>

          <motion.section className="privacySection">
            <h2>7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes
              in our services or legal requirements. Updated versions will
              always be posted on this page.
            </p>
          </motion.section>

          <motion.section className="privacySection">
            <h2>8. Contact Us</h2>
            <p>
              For privacy concerns or data requests, contact our support team
              at:
            </p>
            <p>
              <strong>support@roomify.com</strong>
            </p>
          </motion.section>
        </div>
      </div>
    </>
  );
}
