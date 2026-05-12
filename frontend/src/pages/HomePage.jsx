import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [sport, setSport]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount]       = useState(0);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const fetchMatches = async (q, s, p) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (s) params.set('sport', s);
      params.set('page', p);
      const { data } = await api.get(`/matches/?${params}`);
      setMatches(data.results || []);
      setCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 6));
    } catch { setMatches([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMatches(query, sport, page); }, [query, sport, page]);

  useEffect(() => {
    if (user) {
      setRecLoading(true);
      api.get('/matches/recommendations/')
        .then(res => setRecommendations(res.data))
        .catch(() => setRecommendations([]))
        .finally(() => setRecLoading(false));
    } else {
      setRecommendations([]);
    }
  }, [user]);

  const handleSearch = e => { e.preventDefault(); setPage(1); fetchMatches(query, sport, 1); };
  const handleClear  = () => { setQuery(''); setSport(''); setPage(1); };

  const pageRange = Array.from({ length: totalPages }, (_, i) => i + 1);

  const renderMatchCard = (match, idx) => {
    const emoji = match.sport_type === 'football' ? '⚽' : '🏀';
    const seats = match.available_seats;
    return (
      <div key={match.id} className={`col-12 col-sm-6 col-lg-4 fade-up stagger-${Math.min(idx + 1, 6)}`}>
        <div className="card h-100">
          {/* Match image or placeholder */}
          {match.image_url
            ? <img src={match.image_url} className="match-img" alt={match.title} />
            : <div className="match-img-placeholder">{emoji}</div>
          }
          <div className="card-body d-flex flex-column p-4">
            {/* Sport badge + availability */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className={`sport-pill sport-${match.sport_type}`}>
                {emoji} {match.sport_display}
              </span>
              {seats === 0
                ? <span className="badge" style={{ background: '#fee2e2', color: 'var(--danger)', fontWeight: 700 }}>Sold Out</span>
                : seats <= 10
                  ? <span className="badge" style={{ background: '#fef9c3', color: '#b45309', fontWeight: 700 }}>Only {seats} left</span>
                  : <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}>{seats} seats</span>
              }
            </div>

            {/* Title */}
            <h5 className="fw-700 mb-1" style={{ color: 'var(--text)', fontWeight: 700 }}>{match.title}</h5>

            {/* Teams */}
            <p className="mb-3" style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
              <i className="bi bi-people-fill me-1"></i>
              {match.home_team} <strong style={{ color: 'var(--primary)' }}>vs</strong> {match.away_team}
            </p>

            {/* Date / Venue */}
            <div className="mb-3 d-flex flex-column gap-1" style={{ fontSize: '.84rem', color: 'var(--muted)' }}>
              <span>
                <i className="bi bi-calendar-event me-1" style={{ color: 'var(--primary)' }}></i>
                {new Date(match.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} &bull; {match.time?.slice(0, 5)}
              </span>
              <span>
                <i className="bi bi-geo-alt-fill me-1" style={{ color: 'var(--primary)' }}></i>
                {match.full_location || match.location}
              </span>
            </div>

            {/* Price + CTA */}
            <div className="mt-auto d-flex justify-content-between align-items-center">
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                ${match.price}
              </span>
              <Link to={`/match/${match.id}`} className="btn btn-primary btn-sm px-3">
                View Details <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="container text-center">
          <p className="text-uppercase fw-700 mb-2" style={{ color: 'rgba(255,255,255,.8)', letterSpacing: '.12em', fontSize: '.82rem' }}>
            <i className="bi bi-trophy-fill me-1" style={{ color: 'var(--accent)' }}></i> University Sports
          </p>
          <h1 className="mb-3">
            Book Your Tickets for<br />
            <span>Live Sports Action</span>
          </h1>
          <p className="lead mb-5" style={{ maxWidth: '520px', margin: '0 auto 2rem' }}>
            Football &amp; basketball matches — all in one place.
            Reserve your seat before they sell out.
          </p>
          {!user ? (
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link to="/register" className="btn btn-lg px-5 py-2" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
                <i className="bi bi-person-plus me-1"></i> Get Started Free
              </Link>
              <a href="#matches" className="btn btn-lg px-5 py-2" style={{ border: '2px solid rgba(255,255,255,.6)', color: '#fff', borderRadius: 10, background: 'transparent' }}>
                View Matches
              </a>
            </div>
          ) : (
            <a href="#matches" className="btn btn-lg px-5 py-2" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.15)' }}>
              <i className="bi bi-search me-1"></i> Browse Matches
            </a>
          )}
        </div>
      </section>

      {/* ══ RECOMMENDED MATCHES ══ */}
      {user && !recLoading && recommendations.length > 0 && (
        <section className="py-5" style={{ background: 'var(--primary-lt)', borderBottom: '1px solid var(--card-border)' }}>
          <div className="container">
            <div className="mb-4">
              <p className="section-label"><i className="bi bi-geo-alt-fill me-1"></i>Recommended For You</p>
              <h3 className="fw-bold" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                Matches Near You
                {(user.location || '').trim() && (
                  <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)', marginLeft: '.4rem' }}>
                    — {user.location.trim()}
                  </span>
                )}
              </h3>
            </div>
            <div className="row g-4">
              {recommendations.map((match, idx) => renderMatchCard(match, idx))}
            </div>
          </div>
        </section>
      )}

      {/* ══ SEARCH / FILTER BAR ══ */}
      <section className="search-bar-section">
        <div className="container" id="matches">
          <form onSubmit={handleSearch} className="row g-2 align-items-end">
            <div className="col-12 col-md-6">
              <label className="form-label"><i className="bi bi-search me-1"></i>Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Team name, title, venue…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label"><i className="bi bi-funnel me-1"></i>Sport</label>
              <select className="form-select" value={sport} onChange={e => { setSport(e.target.value); setPage(1); }}>
                <option value="">All Sports</option>
                <option value="football">⚽ Football</option>
                <option value="basketball">🏀 Basketball</option>
              </select>
            </div>
            <div className="col-6 col-md-3 d-flex gap-2">
              <button className="btn btn-primary flex-grow-1" type="submit">
                <i className="bi bi-search me-1"></i>Search
              </button>
              {(query || sport) && (
                <button type="button" className="btn btn-outline-light" onClick={handleClear}>Clear</button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ══ MATCH CARDS ══ */}
      <section className="py-5">
        <div className="container">

          {(query || sport) && !loading && (
            <p className="mb-4" style={{ color: 'var(--muted)' }}>
              Showing <strong style={{ color: 'var(--text)' }}>{count}</strong> result{count !== 1 ? 's' : ''}
              {query && <> for "<em>{query}</em>"</>}
              {sport && <> &bull; {sport.charAt(0).toUpperCase() + sport.slice(1)}</>}
            </p>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status"><span className="visually-hidden">Loading…</span></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '5rem', opacity: .25 }}>🏟️</div>
              <h4 className="mt-3" style={{ color: 'var(--muted)' }}>No matches found</h4>
              <p style={{ color: 'var(--muted)' }}>
                {(query || sport)
                  ? <span>Try a different search or <button className="btn btn-link p-0" style={{ color: 'var(--primary)' }} onClick={handleClear}>clear filters</button>.</span>
                  : 'No matches are scheduled yet. Check back soon!'}
              </p>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {matches.map((match, idx) => renderMatchCard(match, idx))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-5 d-flex justify-content-center" aria-label="Match pages">
                  <ul className="pagination">
                    {page > 1 && (
                      <li className="page-item">
                        <button className="page-link" onClick={() => setPage(p => p - 1)}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                    )}
                    {pageRange.map(num => (
                      <li key={num} className={`page-item${page === num ? ' active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(num)}>{num}</button>
                      </li>
                    ))}
                    {page < totalPages && (
                      <li className="page-item">
                        <button className="page-link" onClick={() => setPage(p => p + 1)}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    )}
                  </ul>
                </nav>
              )}
            </>
          )}

        </div>
      </section>

      {/* ══ SPORT HIGHLIGHTS ══ */}
      <section className="py-5" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--card-border)' }}>
        <div className="container">
          <div className="text-center mb-4">
            <p className="section-label">Explore by Sport</p>
            <h2 className="fw-bold" style={{ color: 'var(--text)' }}>Find Your Game</h2>
          </div>
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div className="card p-4 h-100" style={{ borderLeft: '4px solid #16a34a' }}>
                <div style={{ fontSize: '2.8rem', lineHeight: 1 }}>⚽</div>
                <h4 className="fw-bold mt-3" style={{ color: '#15803d' }}>Football / Soccer</h4>
                <p style={{ color: 'var(--muted)' }}>
                  Watch the best university football teams battle it out on the field.
                  Book your seats now and experience the excitement live!
                </p>
                <button className="btn btn-success btn-sm mt-auto" onClick={() => { setSport('football'); setPage(1); document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  View Football Matches
                </button>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card p-4 h-100" style={{ borderLeft: '4px solid #d97706' }}>
                <div style={{ fontSize: '2.8rem', lineHeight: 1 }}>🏀</div>
                <h4 className="fw-bold mt-3" style={{ color: '#b45309' }}>Basketball</h4>
                <p style={{ color: 'var(--muted)' }}>
                  Cheer for your favourite university basketball squad.
                  Fast-paced, thrilling, and always sold out – get your tickets early!
                </p>
                <button className="btn btn-warning btn-sm mt-auto" onClick={() => { setSport('basketball'); setPage(1); document.getElementById('matches')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  View Basketball Matches
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
