import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaPhoneAlt,
  FaCheckCircle,
} from "react-icons/fa";
import "../Styles/SafetyInformation.css";
import DocumentHeader from "../Components/DocumentHeader";

export default function SafetyInformation() {
  const info = [
    {
      icon: <FaCheckCircle />,
      title: "Verified Hosts & Listings",
      desc: "Every listing on Roomify is checked for authenticity, increasing trust and reducing fraudulent posts.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Secure & Encrypted Messaging",
      desc: "Your conversations and identity remain protected with enterprise-grade encryption.",
    },
    {
      icon: <FaExclamationTriangle />,
      title: "Instant Reporting System",
      desc: "Found something suspicious? Report directly from the listing — our team responds immediately.",
    },
    {
      icon: <FaPhoneAlt />,
      title: "Dedicated Safety Support",
      desc: "Our safety specialists are available 24/7 to assist with urgent concerns or verification checks.",
    },
  ];

  return (
    <>
      <DocumentHeader />
      <div className="safetyPageContainer">
        {/* HEADER */}
        <motion.div
          className="safetyTop"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Safety & Trust at Roomify</h1>
          <p>
            Your peace of mind matters the most. Roomify is designed with global
            safety standards, transparent communication, and verified hosting to
            ensure a secure experience.
          </p>
        </motion.div>

        {/* FEATURE GRID */}
        <div className="safetyGrid">
          {info.map((item, index) => (
            <motion.div
              key={index}
              className="safetyFeatureCard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              whileHover={{ y: -6 }}
            >
              <div className="safetyIcon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* GUIDELINES BOX */}
        <motion.div
          className="guidelinesBox"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2>Essential Safety Guidelines</h2>
          <p className="guidelineSub">
            Follow these practices to stay safe when interacting with hosts or
            visiting properties.
          </p>

          <ul>
            <li>Meet in public locations for the first interaction.</li>
            <li>Verify ownership and room details before any transaction.</li>
            <li>Never share banking or sensitive documents early.</li>
            <li>Keep all communication inside Roomify for added safety.</li>
          </ul>
        </motion.div>
      </div>
    </>
  );
}
