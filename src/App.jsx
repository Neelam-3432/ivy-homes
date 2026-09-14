import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";

const API =
  import.meta.env.VITE_BASE_URL || "https://solve.ivy.homes";
const API_KEY = import.meta.env.VITE_API_KEY;
async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `${API}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    sessionStorage.setItem(
      "token",
      data.access_token
    );

    if (data.refresh_token) {
      sessionStorage.setItem(
        "refresh_token",
        data.refresh_token
      );
    }

    return data.access_token;
  } catch {
    return null;
  }
}


async function apiFetch(endpoint, options = {}, token) {
  let accessToken = token;

  const makeRequest = async (currentToken) => {
    return fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${currentToken}`,
        "X-API-Key": API_KEY,
      },
    });
  };

  let response = await makeRequest(accessToken);

  // Access token expired → refresh it once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      throw new Error("Session expired. Please login again.");
    }

    response = await makeRequest(newToken);
  }

  return response;
}
// -------------------- SAVED LISTINGS --------------------

// function getSavedListings() {
//   try {
//     return JSON.parse(
//       localStorage.getItem("savedListings") || "[]"
//     );
//   } catch {
//     return [];
//   }
// }

// function saveSavedListings(savedListings) {
//   localStorage.setItem(
//     "savedListings",
//     JSON.stringify(savedListings)
//   );
// }

function getSavedListings() {
  try {
    const email = sessionStorage.getItem("user_email");

    if (!email) {
      return [];
    }

    return JSON.parse(
      localStorage.getItem(`savedListings_${email}`) || "[]"
    );
  } catch {
    return [];
  }
}

function saveSavedListings(savedListings) {
  const email = sessionStorage.getItem("user_email");

  if (!email) {
    return;
  }

  localStorage.setItem(
    `savedListings_${email}`,
    JSON.stringify(savedListings)
  );
}
// -------------------- NAVBAR --------------------

function Navbar({
  navigate,
  savedCount,
  logout,
}) {
  return (
    <header className="navbar">
      <h1
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        Ivy Homes
      </h1>

      <div className="nav-actions">
        <button onClick={() => navigate("/")}>
          Listings
        </button>

        <button onClick={() => navigate("/rentals")}>
          Rentals
        </button>

        <button onClick={() => navigate("/projects")}>
          Projects
        </button>
        <button onClick={() => navigate("/insights")}>
  Insights
</button>
        <button onClick={() => navigate("/saved")}>
          Saved ({savedCount})
        </button>

        <button onClick={logout}>Logout</button>
      </div>
    </header>
  );
}

// -------------------- LISTINGS PAGE --------------------

function ListingsPage({
  token,
  logout,
  savedListings,
  toggleSaved,
}) {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [locality, setLocality] = useState("");
  const [bedroom, setBedroom] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchListings(authToken, currentOffset) {
    try {
      setLoading(true);
      setError("");

      // const response = await fetch(
      //   `${API}/v1/listings?limit=20&offset=${currentOffset}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${authToken}`,
      //       "X-API-Key": API_KEY,
      //     },
      //   }
      // );
      const response = await apiFetch(
  `/v1/listings?limit=20&offset=${currentOffset}`,
  {},
  authToken
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || `API error: ${response.status}`
        );
      }

      setListings(data.results || []);
      setHasMore(data.has_more || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchListings(token, offset);
    }
  }, [token, offset]);

  // const filteredListings = listings.filter((listing) => {
  //   const localityMatch =
  //     !locality ||
  //     listing.locality
  //       ?.toLowerCase()
  //       .includes(locality.toLowerCase());

  //   const bedroomMatch =
  //     !bedroom ||
  //     Number(listing.bedroom) === Number(bedroom);

  //   const priceMatch =
  //     !maxPrice ||
  //     Number(listing.price) <= Number(maxPrice);

  //   return localityMatch && bedroomMatch && priceMatch;
  // });

  // function clearFilters() {
  //   setLocality("");
  //   setBedroom("");
  //   setMaxPrice("");
  // }
  const filteredListings = listings.filter((listing) => {
  const localityMatch =
    !locality ||
    listing.locality
      ?.toLowerCase()
      .includes(locality.toLowerCase());

  const bedroomMatch =
    !bedroom ||
    Number(listing.bedroom) === Number(bedroom);

  const priceMatch =
    !maxPrice ||
    Number(listing.price) <= Number(maxPrice);

  const furnishingMatch =
    !furnishing ||
    listing.furnishing?.toLowerCase() ===
      furnishing.toLowerCase();

  return (
    localityMatch &&
    bedroomMatch &&
    priceMatch &&
    furnishingMatch
  );
});

function clearFilters() {
  setLocality("");
  setBedroom("");
  setMaxPrice("");
  setFurnishing("");
}
  return (
    <>
      <Navbar
        navigate={navigate}
        savedCount={savedListings.length}
        logout={logout}
      />

      <main>
        <div className="hero">
          <h2>Find your next home</h2>
          <p>Browse properties available on Ivy Homes</p>
        </div>

        {error && (
          <p className="error">Error: {error}</p>
        )}

        {loading && <p>Loading...</p>}

        {!loading && !error && (
          <>
            <h2>Listings</h2>

            <div className="filters">
              <input
                type="text"
                placeholder="Locality"
                value={locality}
                onChange={(e) =>
                  setLocality(e.target.value)
                }
              />

              <select
                value={bedroom}
                onChange={(e) =>
                  setBedroom(e.target.value)
                }
              >
                <option value="">All BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
              </select>

              {/* <input
                type="number"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value)
                }
              />

              <button onClick={clearFilters}> */}
              <input
  type="number"
  placeholder="Max price"
  value={maxPrice}
  onChange={(e) =>
    setMaxPrice(e.target.value)
  }
/>

<select
  value={furnishing}
  onChange={(e) =>
    setFurnishing(e.target.value)
  }
>
  <option value="">All Furnishing</option>
  <option value="furnished">Furnished</option>
  <option value="semi-furnished">
    Semi-Furnished
  </option>
  <option value="unfurnished">Unfurnished</option>
</select>

<button onClick={clearFilters}>
                Clear
              </button>
            </div>

            <p>
              Showing {filteredListings.length} of{" "}
              {listings.length} listings on this page
            </p>

            <div className="grid">
              {filteredListings.map((listing) => {
                const isSaved = savedListings.includes(
                  listing.listing_id
                );

                return (
                  <div
                    className="card"
                    key={listing.listing_id}
                  >
                    <div
                      onClick={() =>
                        navigate(
                          `/listing/${listing.listing_id}`
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <h3>
                        {listing.title ||
                          listing.apartment_name ||
                          "Property Listing"}
                      </h3>

                      <p>
                        {listing.locality ||
                          "Location unavailable"}
                      </p>

                      <p>
                        {listing.bedroom || "-"} BHK ·{" "}
                        {listing.carpet_area || "-"} sq ft
                      </p>

                      <strong>
                        ₹
                        {Number(
                          listing.price || 0
                        ).toLocaleString("en-IN")}
                      </strong>

                      <p className="view-details">
                        View Details →
                      </p>
                    </div>

                    {/* <button
                      className="save-button"
                      onClick={() =>
                        toggleSaved(listing.listing_id)
                      }
                    >
                      {isSaved
                        ? "♥ Saved"
                        : "♡ Save"}
                    </button> */}
                    <button
  className={`save-button ${
    isSaved ? "saved" : ""
  }`}
  onClick={() =>
    toggleSaved(listing.listing_id)
  }
  title={
    isSaved
      ? "Remove from saved listings"
      : "Save this listing"
  }
>
  {isSaved ? "♥ Saved" : "♡ Save"}
</button>
                  </div>
                );
              })}
            </div>

            {filteredListings.length === 0 && (
              <p>No listings match these filters.</p>
            )}

            <div className="pagination">
              <button
                disabled={
                  offset === 0 || loading
                }
                onClick={() =>
                  setOffset(offset - 20)
                }
              >
                Previous
              </button>

              <span>
                Showing {offset + 1}–
                {offset + listings.length}
              </span>

              <button
                disabled={!hasMore || loading}
                onClick={() =>
                  setOffset(offset + 20)
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

// -------------------- RENTALS PAGE --------------------

function RentalsPage({
  token,
  logout,
  savedListings,
}) {
  const navigate = useNavigate();

  const [rentals, setRentals] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchRentals(authToken, currentOffset) {
    try {
      setLoading(true);
      setError("");

      // const response = await fetch(
      //   `${API}/v1/rentals?limit=20&offset=${currentOffset}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${authToken}`,
      //       "X-API-Key": API_KEY,
      //     },
      //   }
      // );
      const response = await apiFetch(
  `/v1/rentals?limit=20&offset=${currentOffset}`,
  {},
  authToken
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || `API error: ${response.status}`
        );
      }

      setRentals(data.results || []);
      setHasMore(data.has_more || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchRentals(token, offset);
    }
  }, [token, offset]);

  return (
    <>
      <Navbar
        navigate={navigate}
        savedCount={savedListings.length}
        logout={logout}
      />

      <main>
        <div className="hero">
          <h2>Rental Properties</h2>
          <p>Browse rental properties available on Ivy Homes</p>
        </div>

        {error && (
          <p className="error">Error: {error}</p>
        )}

        {loading && <p>Loading rentals...</p>}

        {!loading && !error && (
          <>
            <p>
              Showing {rentals.length} rentals on this page
            </p>

            <div className="grid">
              {rentals.map((rental) => (
                <div
                  className="card"
                  key={rental.listing_id}
                >
                  <h3>
                    {rental.title ||
                      rental.apartment_name ||
                      "Rental Property"}
                  </h3>

                  <p>
                    {rental.locality ||
                      "Location unavailable"}
                  </p>

                  <p>
                    {rental.bedroom || "-"} BHK ·{" "}
                    {rental.carpet_area || "-"} sq ft
                  </p>

                  <strong>
                    ₹
                    {Number(
                      rental.price || 0
                    ).toLocaleString("en-IN")}
                    /month
                  </strong>

                  <p>
                    Furnishing:{" "}
                    {rental.furnishing || "-"}
                  </p>

                  <p>
                    Deposit: ₹
                    {Number(
                      rental.deposit || 0
                    ).toLocaleString("en-IN")}
                  </p>

                  <p>
                    Maintenance: ₹
                    {Number(
                      rental.maintenance || 0
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            {rentals.length === 0 && (
              <p>No rental properties found.</p>
            )}

            <div className="pagination">
              <button
                disabled={
                  offset === 0 || loading
                }
                onClick={() =>
                  setOffset(offset - 20)
                }
              >
                Previous
              </button>

              <span>
                Showing {offset + 1}–
                {offset + rentals.length}
              </span>

              <button
                disabled={!hasMore || loading}
                onClick={() =>
                  setOffset(offset + 20)
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
// -------------------- PROJECTS PAGE --------------------

function ProjectsPage({
  token,
  savedListings,
  logout,
}) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchProjects(authToken, currentOffset) {
    try {
      setLoading(true);
      setError("");

      // const response = await fetch(
      //   `${API}/v1/projects?limit=20&offset=${currentOffset}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${authToken}`,
      //       "X-API-Key": API_KEY,
      //     },
      //   }
      // );
      const response = await apiFetch(
  `/v1/projects?limit=20&offset=${currentOffset}`,
  {},
  authToken
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || `API error: ${response.status}`
        );
      }

      setProjects(data.results || []);
      setHasMore(data.has_more || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchProjects(token, offset);
    }
  }, [token, offset]);

  return (
    <>
      <Navbar
        navigate={navigate}
        savedCount={savedListings.length}
        logout={logout}
      />

      <main>
        <div className="hero">
          <h2>Projects</h2>
          <p>
            Browse residential projects available on Ivy Homes
          </p>
        </div>

        {error && (
          <p className="error">Error: {error}</p>
        )}

        {loading && <p>Loading projects...</p>}

        {!loading && !error && (
          <>
            <p>
              Showing {projects.length} projects on this page
            </p>

            <div className="grid">
              {projects.map((project) => (
                <div
                  className="card"
                  key={project.project_id}
                >
                  <h3>
                    {project.apartment_name ||
                      "Residential Project"}
                  </h3>

                  <p>
                    Developer:{" "}
                    {project.developer_name || "-"}
                  </p>

                  <p>
                    {project.locality ||
                      "Location unavailable"}
                  </p>

                  <p>
                    Status:{" "}
                    {project.project_status || "-"}
                  </p>

                  <p>
                    Area:{" "}
                    {project.min_area_sqft || "-"} -{" "}
                    {project.max_area_sqft || "-"} sq ft
                  </p>

                  <strong>
                    ₹
                    {Number(
                      project.price_min || 0
                    ).toLocaleString("en-IN")}
                    {" - "}
                    ₹
                    {Number(
                      project.price_max || 0
                    ).toLocaleString("en-IN")}
                  </strong>

                  <p>
                    Total Units:{" "}
                    {project.total_units || "-"}
                  </p>

                  <p>
                    Total Listings:{" "}
                    {project.total_listings || "-"}
                  </p>

                  <p>
                    RERA:{" "}
                    {project.rera_number || "-"}
                  </p>
                </div>
              ))}
            </div>

            {projects.length === 0 && (
              <p>No projects found.</p>
            )}

            <div className="pagination">
              <button
                disabled={offset === 0 || loading}
                onClick={() =>
                  setOffset(offset - 20)
                }
              >
                Previous
              </button>

              <span>
                Showing {offset + 1}–
                {offset + projects.length}
              </span>

              <button
                disabled={!hasMore || loading}
                onClick={() =>
                  setOffset(offset + 20)
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
// -------------------- INSIGHTS PAGE --------------------

function InsightsPage({
  token,
  savedListings,
  logout,
}) {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchInsights(authToken) {
    try {
      setLoading(true);
      setError("");

      // const response = await fetch(
      //   `${API}/v1/analytics/summary`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${authToken}`,
      //       "X-API-Key": API_KEY,
      //     },
      //   }
      // );
      const response = await apiFetch(
  "/v1/analytics/summary",
  {},
  token
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || `API error: ${response.status}`
        );
      }

      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchInsights(token);
    }
  }, [token]);

  return (
    <>
      <Navbar
        navigate={navigate}
        savedCount={savedListings.length}
        logout={logout}
      />

      <main>
        <div className="hero">
          <h2>Insights</h2>
          <p>
            Property market insights from the Ivy Homes API
          </p>
        </div>

        {loading && <p>Loading insights...</p>}

        {error && (
          <div className="error">
            <p>
              Analytics summary is currently unavailable.
            </p>
            <p>{error}</p>
          </div>
        )}

        {!loading && summary && (
          <div className="card">
            <h3>Analytics Summary</h3>

            <pre>
              {JSON.stringify(summary, null, 2)}
            </pre>
          </div>
        )}

        {!loading && !summary && !error && (
          <p>No insights available.</p>
        )}

        <div className="card">
          <h3>Application Insights</h3>

          <p>
            <strong>Total listings analysed:</strong>{" "}
            4100
          </p>

          <p>
            <strong>Active listings:</strong>{" "}
            3233
          </p>

          <p>
            <strong>Thoraipakkam monthly rent:</strong>{" "}
            ₹57,77,900
          </p>

          <p>
            <strong>Thoraipakkam 2BHK average price/sq ft:</strong>{" "}
            ₹17,330.28
          </p>

          <p>
            <strong>Listings added in the last 7 days:</strong>{" "}
            122
          </p>

          <p>
            <strong>Projects with listing-count mismatch:</strong>{" "}
            336
          </p>
        </div>
      </main>
    </>
  );
}
// -------------------- SAVED PAGE --------------------

function SavedPage({
  token,
  savedListings,
  toggleSaved,
}) {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSavedListings() {
      try {
        setLoading(true);
        setError("");

        const results = await Promise.all(
          savedListings.map(async (id) => {
            // const response = await fetch(
            //   `${API}/v1/listings/${id}`,
            //   {
            //     headers: {
            //       Authorization: `Bearer ${token}`,
            //       "X-API-Key": API_KEY,
            //     },
            //   }
            // );
            const response = await apiFetch(
  `/v1/listings/${id}`,
  {},
  token
);

            if (!response.ok) {
              return null;
            }

            return response.json();
          })
        );

        setListings(results.filter(Boolean));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSavedListings();
  }, [savedListings, token]);

  return (
    <>
      <header className="navbar">
        <h1>Ivy Homes</h1>

        <button
          onClick={() => navigate("/")}
        >
          ← Listings
        </button>
      </header>

      <main>
        <h2>Saved Listings</h2>

        {loading && <p>Loading saved listings...</p>}

        {error && (
          <p className="error">Error: {error}</p>
        )}

        {!loading &&
          !error &&
          listings.length === 0 && (
            <div className="empty-state">
              <h3>No saved listings</h3>
              <p>
                Save properties from the listings
                page to see them here.
              </p>

              <button
                onClick={() => navigate("/")}
              >
                Browse Listings
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          listings.length > 0 && (
            <div className="grid">
              {listings.map((listing) => (
                <div
                  className="card"
                  key={listing.listing_id}
                >
                  <div
                    onClick={() =>
                      navigate(
                        `/listing/${listing.listing_id}`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <h3>
                      {listing.title ||
                        listing.apartment_name ||
                        "Property Listing"}
                    </h3>

                    <p>
                      {listing.locality ||
                        "Location unavailable"}
                    </p>

                    <p>
                      {listing.bedroom || "-"} BHK ·{" "}
                      {listing.carpet_area || "-"} sq ft
                    </p>

                    <strong>
                      ₹
                      {Number(
                        listing.price || 0
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  {/* <button
                    className="save-button"
                    onClick={() =>
                      toggleSaved(listing.listing_id)
                    }
                  >
                    ♥ Remove
                  </button> */}
                  <button
  className="save-button saved"
  onClick={() =>
    toggleSaved(listing.listing_id)
  }
  title="Remove from saved listings"
>
  ♥ Saved
</button>
                </div>
              ))}
            </div>
          )}
      </main>
    </>
  );
}

// -------------------- DETAIL PAGE --------------------

function ListingDetail({
  token,
  savedListings,
  toggleSaved,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API}/v1/listings/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-API-Key": API_KEY,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              `API error: ${response.status}`
          );
        }

        setListing(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id, token]);

  if (loading) {
    return (
      <main>
        <p>Loading listing...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <button onClick={() => navigate(-1)}>
          ← Back
        </button>

        <p className="error">
          Error: {error}
        </p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main>
        <p>Listing not found.</p>
      </main>
    );
  }

  const isSaved = savedListings.includes(
    listing.listing_id
  );

  return (
    <>
      <header className="navbar">
        <h1>Ivy Homes</h1>

        <button onClick={() => navigate(-1)}>
          ← Back
        </button>
      </header>

      <main>
        {/* <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back to listings
        </button> */}

        <div className="detail-card">
          <h2>
            {listing.title ||
              listing.apartment_name ||
              "Property Listing"}
          </h2>

          <p className="detail-location">
            {listing.locality ||
              "Location unavailable"}
          </p>

          <button
            className="save-button detail-save"
            onClick={() =>
              toggleSaved(listing.listing_id)
            }
          >
            {isSaved
              ? "♥ Saved"
              : "♡ Save Listing"}
          </button>

          <div className="detail-grid">
            <div>
              <span>Price</span>
              <strong>
                ₹
                {Number(
                  listing.price || 0
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Bedrooms</span>
              <strong>
                {listing.bedroom || "-"} BHK
              </strong>
            </div>

            <div>
              <span>Carpet Area</span>
              <strong>
                {listing.carpet_area || "-"} sq ft
              </strong>
            </div>

            <div>
              <span>Furnishing</span>
              <strong>
                {listing.furnishing || "-"}
              </strong>
            </div>
          </div>

          <hr />

          <p>
            <strong>Listing ID:</strong>{" "}
            {listing.listing_id}
          </p>

          {listing.project_id && (
            <p>
              <strong>Project ID:</strong>{" "}
              {listing.project_id}
            </p>
          )}

          {listing.floor && (
            <p>
              <strong>Floor:</strong>{" "}
              {listing.floor}
            </p>
          )}

          {listing.total_floors && (
            <p>
              <strong>Total Floors:</strong>{" "}
              {listing.total_floors}
            </p>
          )}

          {listing.created_at && (
            <p>
              <strong>Listed:</strong>{" "}
              {new Date(
                listing.created_at
              ).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </main>
    </>
  );
}

// -------------------- LOGIN --------------------

function LoginPage({ setToken }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
          body: JSON.stringify({
            email: import.meta.env.VITE_EMAIL,
            password: import.meta.env.VITE_PASSWORD,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            `Login failed: ${response.status}`
        );
      }

      // sessionStorage.setItem(
      //   "token",
      //   data.access_token
      // );

      // setToken(data.access_token);
      sessionStorage.setItem(
  "token",
  data.access_token
);

sessionStorage.setItem(
  "refresh_token",
  data.refresh_token
);
sessionStorage.setItem(
  "user_email",
  data.user.email
);
setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="login-card">
        <h2>Welcome to Ivy Homes</h2>
        <p>
          Login to browse property listings.
        </p>

        {error && (
          <p className="error">
            Error: {error}
          </p>
        )}

        <button
          onClick={login}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </main>
  );
}

// -------------------- APP --------------------

function App() {
  const [token, setToken] = useState(
    sessionStorage.getItem("token") || ""
  );

  const [savedListings, setSavedListings] =
    useState(getSavedListings);

  function toggleSaved(listingId) {
    setSavedListings((current) => {
      const alreadySaved =
        current.includes(listingId);

      const updated = alreadySaved
        ? current.filter(
            (id) => id !== listingId
          )
        : [...current, listingId];

      saveSavedListings(updated);

      return updated;
    });
  }

  // function logout() {
  //   sessionStorage.removeItem("token");
  //   setToken("");
  // }
  function logout() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user_email");
  setToken("");
}

  return (
    <BrowserRouter>
      {!token ? (
        <LoginPage setToken={setToken} />
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <ListingsPage
                token={token}
                logout={logout}
                savedListings={savedListings}
                toggleSaved={toggleSaved}
              />
            }
          />

          <Route
            path="/rentals"
            element={
              <RentalsPage
                token={token}
                logout={logout}
                savedListings={savedListings}
              />
            }
          />
          <Route
  path="/projects"
  element={
    <ProjectsPage
      token={token}
      logout={logout}
      savedListings={savedListings}
    />
  }
/>
<Route
  path="/insights"
  element={
    <InsightsPage
      token={token}
      logout={logout}
      savedListings={savedListings}
    />
  }
/>
          <Route
            path="/saved"
            element={
              <SavedPage
                token={token}
                savedListings={savedListings}
                toggleSaved={toggleSaved}
              />
            }
          />

          <Route
            path="/listing/:id"
            element={
              <ListingDetail
                token={token}
                savedListings={savedListings}
                toggleSaved={toggleSaved}
              />
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;