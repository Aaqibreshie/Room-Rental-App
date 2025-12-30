import React, { useState } from "react";
import "../Styles/Contact.css";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import DocumentHeader from "../Components/DocumentHeader";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <DocumentHeader />
      <div className="contactWrapper">
        {/* HERO */}
        <section className="contactHero fadeIn">
          <h1>Contact Roomify</h1>
          <p>We'd love to hear from you. Our team is here to help anytime.</p>
        </section>

        {/* CONTACT GRID */}
        <section className="contactInfoSection fadeIn">
          <h2>Get in Touch</h2>

          <div className="contactInfoGrid">
            <div className="contactInfoCard">
              <FaPhoneAlt className="contactInfoIcon" />
              <h4>Call Us</h4>
              <p>+91 98765 43210</p>
            </div>

            <div className="contactInfoCard">
              <FaEnvelope className="contactInfoIcon" />
              <h4>Email Support</h4>
              <p>support@roomify.com</p>
            </div>

            <div className="contactInfoCard">
              <FaMapMarkerAlt className="contactInfoIcon" />
              <h4>Visit Us</h4>
              <p>Srinagar, Jammu & Kashmir, India</p>
            </div>
          </div>
        </section>

        {/* FORM + MAP SECTION */}
        <section className="contactFormSection fadeIn">
          {/* FORM */}
          <div className="contactFormCard">
            <h3>Send Us a Message</h3>

            <input
              type="text"
              placeholder="Your name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />

            <input
              type="email"
              placeholder="Your email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />

            <textarea
              placeholder="Your message"
              name="message"
              value={formData.message}
              onChange={handleChange}
            ></textarea>

            <button className="contactSubmit">Send Message</button>
          </div>

          {/* MAP */}
          <div className="contactMapCard">
            <iframe
              title="map"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: "18px" }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed/v1/place?key=AIzaSyD_fake-key-for-ui-only&q=Srinagar+India"
            ></iframe>
          </div>
        </section>
      </div>
    </>
  );
}
