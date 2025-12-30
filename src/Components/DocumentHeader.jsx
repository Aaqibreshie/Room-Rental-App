// src/Components/StaticHeader.jsx
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import "../Styles/DocumentHeader.css";

export default function DocumentHeader({
  title = "Roomify",
  subtitle,
  showBack = true,
  showHome = true,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="staticHeaderOuter">
      <motion.header
        className="staticHeader"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="staticHeaderInner">
          <div className="staticHeaderLeft">
            {showBack && (
              <button
                type="button"
                className="shIconBtn shGhostBtn"
                onClick={handleBack}
                aria-label="Go back"
              >
                <FaArrowLeft />
              </button>
            )}

            <Link to="/" className="shBrandBlock">
              <div className="shBrandAvatar">
                <span className="shBrandDot" />
              </div>
              <div className="shBrandText">
                <span className="shBrandTitle">{title}</span>
                {subtitle && (
                  <span className="shBrandSubtitle">{subtitle}</span>
                )}
              </div>
            </Link>
          </div>

          <div className="staticHeaderRight">
            {showHome && (
              <Link to="/" className="shIconBtn shPrimaryBtn">
                <FaHome style={{ marginRight: 6 }} />
                <span>Back to home</span>
              </Link>
            )}
          </div>
        </div>
      </motion.header>
    </div>
  );
}
