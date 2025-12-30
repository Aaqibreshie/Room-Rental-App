import { motion } from "framer-motion";
import { FaUsers, FaHome, FaShieldAlt, FaGlobeAsia } from "react-icons/fa";
import "../Styles/About.css";
import DocumentHeader from "../Components/DocumentHeader";

export default function About() {
  const stats = [
    { number: "50K+", label: "Users Helped" },
    { number: "12K+", label: "Verified Listings" },
    { number: "4.9★", label: "Average Rating" },
    { number: "18+", label: "Cities Covered" },
  ];

  const values = [
    {
      icon: <FaShieldAlt />,
      title: "Trust & Safety First",
      desc: "We deeply verify hosts, listings, and user interactions to ensure a secure rental experience.",
    },
    {
      icon: <FaUsers />,
      title: "Community Driven",
      desc: "Roomify is built around helping students, professionals, and families find safe accommodation easily.",
    },
    {
      icon: <FaHome />,
      title: "Redefining Renting",
      desc: "We make renting transparent, accessible, and modern — no hidden fees or confusing processes.",
    },
    {
      icon: <FaGlobeAsia />,
      title: "Expanding Globally",
      desc: "Our vision is to make Roomify available across the world, one safe home at a time.",
    },
  ];

  return (
    <>
      <DocumentHeader />
      <div className="aboutPageWrap">
        {/* HERO SECTION */}
        <motion.section
          className="aboutHero"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>About Roomify</h1>
          <p>
            Roomify is redefining how people find rooms — through safety,
            transparency, and modern technology. Our mission is simple: make
            renting stress-free.
          </p>
        </motion.section>

        {/* STATS SECTION */}
        <section className="statsSection">
          <div className="statsGrid">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                className="statCard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
              >
                <h2>{s.number}</h2>
                <p>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* OUR VALUES / WHAT WE DO */}
        <section className="valuesSection">
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            What Drives Us
          </motion.h2>

          <div className="valuesGrid">
            {values.map((v, i) => (
              <motion.div
                key={i}
                className="valueCard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -8 }}
              >
                <div className="valueIcon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
        {/* FOUNDER SECTION */}
        <section className="founderSection">
          <motion.div
            className="founderCard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="founderImage"></div>

            <div className="founderContent">
              <h2>Meet the Founder</h2>

              <h3 className="founderName">Aaqib Reshie</h3>
              <p className="founderRole">Founder & CEO, Roomify</p>

              <p className="founderMessage">
                “Roomify was born from a simple idea — finding a safe,
                affordable room should never be hard. After seeing thousands of
                people struggle with unsafe listings and confusing processes, I
                decided to build a platform focused on trust, transparency, and
                comfort. Today, Roomify stands as a bridge between people and
                safe homes.”
              </p>
            </div>
          </motion.div>
        </section>

        {/* STORY SECTION */}
        <motion.section
          className="storySection"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>Our Story</h2>

          <p>
            Roomify was created to solve a real problem — finding a good room is
            hard. Too many people struggle with unclear listings, unsafe
            environments, and unreliable information. We built Roomify to change
            that.
          </p>

          <p>
            Today, Roomify connects thousands of people with trusted hosts every
            day. We're continuously improving with smarter verification, better
            search tools, and stronger safety systems — shaping the future of
            renting.
          </p>
        </motion.section>
      </div>
    </>
  );
}
