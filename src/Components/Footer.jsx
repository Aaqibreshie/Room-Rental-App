import "../Styles/Footer.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerContainer">
        <div className="footerTop">
          <div className="footerColumn">
            <h4>Support</h4>
            <Link to="/help">Help Center</Link>
            <Link to="/safety">Safety Information</Link>
            <Link to="/contact">Contact Us</Link>
          </div>

          <div className="footerColumn">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms & Conditions</Link>
          </div>
        </div>

        <div className="footerBottom">
          <p>© {new Date().getFullYear()} Roomify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
