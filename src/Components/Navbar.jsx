import { useState, useEffect } from "react";
import "../Styles/Navbar.css";
import { IoSearchOutline } from "react-icons/io5";
import { FaRegUserCircle, FaHeart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../Components/Searchbar.jsx";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [openSearch, setOpenSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUser(d.data);
          // if backend returns savedRooms array length
          if (d.data.savedRooms) setSavedCount(d.data.savedRooms.length);
          else {
            // fallback: fetch saved count
            fetch("http://localhost:5000/api/auth/me/saved-rooms", {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => r.json())
              .then((res) => {
                if (res.success) setSavedCount(res.data.length || 0);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  function logoutHandler() {
    localStorage.removeItem("token");
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <>
      <motion.nav
        className="navbar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="navLeft">
          <Link to="/" className="logo">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              Roomify
            </motion.span>
          </Link>
        </div>

        <motion.div className="navCenter" whileHover={{ scale: 1.03 }}>
          <button className="searchTrigger" onClick={() => setOpenSearch(true)}>
            <span>Search Rooms</span>
            <IoSearchOutline size={18} />
          </button>
        </motion.div>

        <div className="navRight">
          {/* Saved Rooms – only when logged in */}
          {user && (
            <motion.div
              className="iconBox savedIcon"
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/saved-rooms")}
              title="Saved rooms"
            >
              <FaHeart size={18} />
              {savedCount > 0 && (
                <span className="savedCount">{savedCount}</span>
              )}
            </motion.div>
          )}

          {/* Profile Menu */}
          <motion.div
            className="menuBox"
            whileTap={{ scale: 0.95 }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <FaRegUserCircle size={22} />
          </motion.div>

          {/* Dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="dropdown menuDropdown"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.12 }}
              >
                {!user ? (
                  <>
                    <Link
                      className="dropdownItem"
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                    >
                      Login
                    </Link>

                    <Link
                      className="dropdownItem"
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="dropdownItem"
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>

                    <button
                      className="dropdownItem logoutBtn"
                      onClick={logoutHandler}
                    >
                      Logout
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      <SearchBar isOpen={openSearch} onClose={() => setOpenSearch(false)} />
    </>
  );
}
