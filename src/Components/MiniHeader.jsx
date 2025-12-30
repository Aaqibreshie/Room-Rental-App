// src/Components/MiniHeader.jsx
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHome } from "react-icons/fi";
import "../Styles/MiniHeader.css";

export default function MiniHeader({ title, subtitle }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="premiumHeaderWrap">
      <header className="premiumHeader">
        <div className="premiumHeaderLeft">
          <button
            className="premiumBackBtn"
            type="button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <FiArrowLeft />
          </button>

          <div className="premiumTitleBlock">
            <span className="premiumTitle">{title}</span>
            {subtitle && <span className="premiumSubtitle">{subtitle}</span>}
          </div>
        </div>

        <button
          className="premiumHomeBtn"
          type="button"
          onClick={() => navigate("/")}
        >
          <FiHome />
          <span className="premiumHomeLabel">Home</span>
        </button>
      </header>
    </div>
  );
}
