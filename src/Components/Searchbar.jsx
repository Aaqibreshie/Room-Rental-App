import { useState, useRef, useEffect } from "react";
import "../Styles/Searchbar.css";
import { IoSearchOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ isOpen, onClose }) {
  const ref = useRef();
  const navigate = useNavigate();

  const [search, setSearch] = useState({
    location: "",
    max: "",
    type: "",
  });

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  function handleSearch() {
    navigate("/", {
      state: {
        searchFilters: search,
      },
    });

    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="searchOverlay">
      <div ref={ref} className="searchContainer">
        <div className="searchHeader">
          <h3>Search Rooms</h3>
        </div>

        <div className="searchFields">
          {/* LOCATION */}
          <div className="inputGroup">
            <label>Location</label>
            <input
              type="text"
              placeholder="Where are you going?"
              value={search.location}
              onChange={(e) =>
                setSearch({ ...search, location: e.target.value })
              }
            />
          </div>

          {/* PRICE */}
          <div className="inputGroup">
            <label>Max Price</label>
            <input
              type="number"
              placeholder="Max price (₹)"
              value={search.max}
              onChange={(e) => setSearch({ ...search, max: e.target.value })}
            />
          </div>

          {/* ROOM TYPE */}
          <div className="inputGroup">
            <label>Room Type</label>
            <select
              value={search.type}
              onChange={(e) => setSearch({ ...search, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="single">Single Room</option>
              <option value="shared">Shared Room</option>
              <option value="pg">PG</option>
              <option value="hostel">Hostel</option>
            </select>
          </div>
        </div>

        <button className="searchBtn" onClick={handleSearch}>
          <IoSearchOutline size={20} />
          Search
        </button>
      </div>
    </div>
  );
}
