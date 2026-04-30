import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function MatchCard({ match }) {
  const emoji = match.sport_type === 'football' ? '⚽' : '🏀';
  const seats = match.available_seats;
  const badgeCls = seats === 0 ? 'badge-danger' : seats < 10 ? 'badge-warning' : 'badge-success';
  const badgeTxt = seats === 0 ? 'Sold Out' : `${seats} left`;

  return (
    <Link to={`/match/${match.id}`} style={{ textDecoration:'none', color:'inherit' }}>
      <div className="match-card">
        {match.image_url
          ? <img className="match-card-img" src={match.image_url} alt={match.title} />
          : <div className="match-card-img-placeholder">{emoji}</div>
        }
        <div className="match-card-body">
          <div className="match-card-teams">{match.home_team} vs {match.away_team}</div>
          <div className="match-card-meta">
            <span>📅 {new Date(match.date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</span>
            <span>📍 {match.location}</span>
            <span>🏆 {match.sport_display}</span>
          </div>
          <div className="match-card-footer">
            <span className="match-price">${match.price}</span>
            <span className={`badge ${badgeCls}`}>{badgeTxt}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [sport, setSport]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount]       = useState(0);

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

  const handleSearch = e => { e.preventDefault(); setPage(1); fetchMatches(query, sport, 1); };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Live Sports Tickets</h1>
          <p className="page-subtitle">Book your seats for the best university sports events</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="search-bar">
          <input className="form-control" placeholder="Search by team, title, or venue…"
            value={query} onChange={e => setQuery(e.target.value)} />
          <select className="form-control" style={{ maxWidth:'160px' }}
            value={sport} onChange={e => { setSport(e.target.value); setPage(1); }}>
            <option value="">All sports</option>
            <option value="football">⚽ Football</option>
            <option value="basketball">🏀 Basketball</option>
          </select>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        {/* Results count */}
        {!loading && <p className="text-muted text-sm mb-1">{count} match{count !== 1 ? 'es' : ''} found</p>}

        {/* Grid */}
        {loading
          ? <div className="loading-center"><div className="spinner" /></div>
          : matches.length === 0
            ? <div className="text-center mt-3" style={{ color:'var(--muted)' }}>No matches found. Try a different search.</div>
            : <div className="match-grid">{matches.map(m => <MatchCard key={m.id} match={m} />)}</div>
        }

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
            <span className="text-muted text-sm">Page {page} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
