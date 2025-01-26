import React, { useState } from "react";
import "./SearchBar.css";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false); // Controls visibility of the result box
  const [currentPage, setCurrentPage] = useState(1); // Tracks current pagination page

  const resultsPerPage = 3;

  const handleSearch = async () => {
    setError(null);
    setResults([]); // Clear previous results
    setShowResults(true); // Show result box on button click
    try {
      const response = await fetch(
        `http://localhost:8080/payload.PayloadService/SearchByTitle?query=${searchQuery}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setResults([]);
          setError("No results found.");
        } else {
          throw new Error("Failed to fetch results.");
        }
        return;
      }

      const data = await response.json();
      setResults(data);
      setError(null);
      setCurrentPage(1); // Reset to the first page on new search
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Error fetching results. Please try again.");
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const paginatedResults = results.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const totalPages = Math.ceil(results.length / resultsPerPage);

  return (
    <div className="search-bar">
      <div className="search-page">
        <div className="content">
          <h1 className="title">Search with</h1>
          <h1>
            <span className="highlight">Seamless Power</span>
          </h1>

          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-button" onClick={handleSearch}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="arrow-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>

          {/* Result Box */}
          {showResults && (
            <div className="result-box">
              {error ? (
                <div className="error">{error}</div>
              ) : paginatedResults.length > 0 ? (
                paginatedResults.map((result) => (
                  <div key={result.id} className="result-item">
                    <h3>Title: {result.title}</h3>
                    <p>Type: {result.type}</p>
                  </div>
                ))
              ) : (
                <p className="placeholder-text">No results found.</p>
              )}

              {/* Pagination */}
              {results.length > resultsPerPage && (
                <div className="pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="pagination-button"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="pagination-button"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;