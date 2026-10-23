import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X, UserRound, ShieldCheck, Compass, KeyRound } from 'lucide-react';
import { useAuth, isDemo } from './lib/auth';
import Hero from './components/Hero';
import Inventory from './components/Inventory';
import AuthPage from './components/AuthPage';
import Admin from './components/Admin';
function Protected({ children }) {
  const { user } = useAuth(),
    location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location]);
  return (
    <>
      <header className="site-header" id="top">
        <Link to="/" className="brand" aria-label="AutoBest Motors home">
          <span className="brand-icon">
            A<span />
          </span>
          <span>
            AUTOBEST<small>M O T O R S</small>
          </span>
        </Link>
        <nav className={open ? 'open' : ''} aria-label="Main navigation">
          <NavLink to={user ? '/inventory' : '/'} end>
            Showroom
          </NavLink>
          <a href="/#approach" onClick={() => setOpen(false)}>
            Our approach
          </a>
          {user?.role === 'admin' && <NavLink to="/admin">Manage inventory</NavLink>}
        </nav>
        <div className="header-right">
          {user ? (
            <>
              <span className="account-label">
                <UserRound size={15} />
                {user.role === 'admin' ? 'Admin' : 'My account'}
              </span>
              <button className="sign-in" onClick={logout}>
                Sign out <ArrowUpRight size={15} />
              </button>
            </>
          ) : (
            <Link to="/login" className="sign-in">
              Sign in <ArrowUpRight size={15} />
            </Link>
          )}
          <button
            className="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {isDemo && (
        <div className="demo-banner">
          <span className="demo-dot" /> FRONTEND PREVIEW <span className="demo-divider">/</span>
          <span>Sample cars. Demo purchases. No payments.</span>
        </div>
      )}
    </>
  );
}
function Approach() {
  return (
    <section className="approach section-shell" id="approach">
      <div>
        <p className="eyebrow">THE AUTOBEST WAY</p>
        <h2>
          Good cars.
          <br />
          <em>Better journeys.</em>
        </h2>
      </div>
      <div className="approach-points">
        {[
          [
            Compass,
            'A considered collection',
            'Explore by make, model, category, and price. Find a car that feels like you.',
          ],
          [
            ShieldCheck,
            'Clarity at every turn',
            'Vehicle details and stock availability, all in one place.',
          ],
          [
            KeyRound,
            'Your next chapter',
            'From first look to your next drive, a simpler way forward.',
          ],
        ].map(([Icon, title, copy]) => (
          <div key={title}>
            <Icon size={23} />
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="section-shell">
      <Link className="footer-brand" to="/">
        AUTOBEST <span>MOTORS</span>
      </Link>
      <p>Driven by distinction.</p>
      <span>© {new Date().getFullYear()} AutoBest Motors</span>
      <a href="#top">Back to top ↑</a>
    </footer>
  );
}
export default function App() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
    else setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 100);
  }, [location.pathname, location.hash]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <div id="main">
        <Routes>
          <Route
            path="/"
            element={
              <main>
                <Hero />
                <Inventory />
                <Approach />
              </main>
            }
          />
          <Route
            path="/inventory"
            element={
              <Protected>
                <main>
                  <Hero />
                  <Inventory />
                  <Approach />
                </main>
              </Protected>
            }
          />
          <Route path="/login" element={<AuthPage key="login" />} />
          <Route path="/register" element={<AuthPage register key="register" />} />
          <Route
            path="/admin"
            element={
              <Protected>
                <Admin />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <main className="empty-state">
                <h1>A road less travelled.</h1>
                <p>This page doesn’t exist.</p>
                <Link className="button primary" to="/">
                  Return to showroom
                </Link>
              </main>
            }
          />
        </Routes>
      </div>
      <Footer />
    </>
  );
}
