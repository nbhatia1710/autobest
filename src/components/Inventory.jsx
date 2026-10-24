import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Search, SlidersHorizontal, X, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, isDemo } from '../lib/auth';
import { vehicles as sample, money, formatIndianLakhsCrores } from '../lib/seed';
import { validateFilters } from '../lib/validation';
import VehicleCard, { VehicleImage } from './VehicleCard';
import Modal from './Modal';
import Field from './Field';
const empty = { make: '', model: '', category: '', min_price: '', max_price: '' };
export default function Inventory() {
  const { user, api } = useAuth();
  const [filters, setFilters] = useState(empty),
    [rows, setRows] = useState([]),
    [status, setStatus] = useState('loading'),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [refresh, setRefresh] = useState(0),
    [selected, setSelected] = useState(null),
    [purchase, setPurchase] = useState(null),
    [busy, setBusy] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [sort, setSort] = useState('featured');
  const request = useRef(0),
    filterError = validateFilters(filters);
  const [customer, setCustomer] = useState({ name: '', email: '', address: '' });
  useEffect(() => {
    if (!user) return;
    const id = ++request.current;
    const controller = new AbortController();
    if (filterError) {
      setStatus('invalid');
      return;
    }
    setStatus('loading');
    const timer = setTimeout(() => {
      api
        .list(filters, controller.signal)
        .then((data) => {
          if (id === request.current) {
            setRows(Array.isArray(data) ? data : data.items);
            setStatus('ready');
            setError('');
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError' && id === request.current) {
            setError(err.message);
            setStatus('error');
          }
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, api, user, refresh, filterError]);
  const display = (user ? rows : sample.slice(0, 3))
    .slice()
    .sort((a, b) =>
      sort === 'price-up'
        ? a.price - b.price
        : sort === 'price-down'
          ? b.price - a.price
          : sort === 'newest'
            ? b.year - a.year
            : 0,
    );
  function startPurchase(v) {
    setCustomer({ name: '', email: user?.email || '', address: '' });
    setNotice('');
    setError('');
    setPurchase(v);
  }
  async function confirmPurchase(event) {
    event.preventDefault();
    if (busy) return;
    const details = Object.fromEntries(
      Object.entries(customer).map(([key, value]) => [key, value.trim()]),
    );
    if (!details.name || !details.address) {
      setError('Please enter your name and address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await api.purchase(purchase.id, details);
      setRows((old) => old.map((v) => (v.id === updated.id ? updated : v)));
      if (selected?.id === updated.id) setSelected(updated);
      setNotice(
        `${purchase.make} ${purchase.model}: ${isDemo ? 'demo purchase complete' : 'purchase complete'}. Thank you!`,
      );
      setPurchase(null);
      setRefresh((n) => n + 1);
    } catch (err) {
      setError(
        err.status === 409
          ? 'This vehicle’s stock changed. We’ve refreshed the collection; please try another vehicle.'
          : err.message,
      );
      if (err.status === 409) {
        setPurchase(null);
        setSelected(null);
        setRefresh((n) => n + 1);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="collection section-shell" id="collection">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span className="gold-dash" /> THE COLLECTION
          </p>
          <h2>
            Find your <em>next drive.</em>
          </h2>
        </div>
        <p>
          Every car has a story.
          <br />
          The next one could be yours.
        </p>
      </div>
      {!user ? (
        <div className="preview-note">
          <span>A glimpse of the collection. Sign in to view live availability and purchase.</span>
          <Link to="/login" className="text-link">
            Enter the showroom <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          <div className="filter-bar">
            <label className="search-input">
              <Search size={18} />
              <input
                aria-label="Search by model"
                placeholder="Find a model…"
                value={filters.model}
                onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              />
            </label>
            <label className="sr-only" htmlFor="make">
              Make
            </label>
            <select
              id="make"
              value={filters.make}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setAdvanced(true);
                  setFilters({ ...filters, make: '' });
                } else setFilters({ ...filters, make: e.target.value });
              }}
            >
              <option value="">All makes</option>
              {[
                ...new Set([
                  'Audi',
                  'BMW',
                  'Land Rover',
                  'Mercedes-Benz',
                  'Toyota',
                  ...(filters.make ? [filters.make] : []),
                ]),
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
              <option value="__custom__">Other make…</option>
            </select>
            <button
              className={`filter-toggle ${advanced ? 'active' : ''}`}
              onClick={() => setAdvanced(!advanced)}
              aria-expanded={advanced}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
          {advanced && (
            <div className="advanced-filters">
              <label className="field">
                <span>Custom make</span>
                <input
                  value={filters.make}
                  onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                  placeholder="Any manufacturer"
                />
              </label>
              <label className="field">
                <span>Minimum price (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={filters.min_price}
                  onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Maximum price (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={filters.max_price}
                  onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                />
              </label>
              <button className="text-link" onClick={() => setFilters(empty)}>
                Clear filters <X size={15} />
              </button>
            </div>
          )}
          <div className="collection-toolbar">
            <div className="categories">
              {['', 'Coupe', 'SUV', 'Sedan', 'Hatchback', 'Convertible', 'Truck'].map((c) => (
                <button
                  key={c}
                  className={filters.category === c ? 'selected' : ''}
                  onClick={() => setFilters({ ...filters, category: c })}
                >
                  {c || 'All vehicles'}
                </button>
              ))}
            </div>
            <select
              aria-label="Sort vehicles"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured first</option>
              <option value="price-up">Price: low to high</option>
              <option value="price-down">Price: high to low</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </>
      )}
      {filterError && (
        <p role="alert" className="error">
          {filterError}
        </p>
      )}
      {notice && (
        <p className="success-message" role="status">
          <Check size={18} />
          {notice}
          <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </p>
      )}
      {error && !purchase && (
        <div className="error" role="alert">
          {error}
          {status === 'error' && (
            <button onClick={() => setRefresh((n) => n + 1)}>Try again</button>
          )}
        </div>
      )}
      {user && status === 'loading' ? (
        <div className="vehicle-grid" aria-label="Loading vehicles" role="status">
          {[1, 2, 3].map((n) => (
            <div className="skeleton" key={n} />
          ))}
        </div>
      ) : user && status === 'ready' && !display.length ? (
        <div className="empty-state">
          <Search size={30} />
          <h3>No cars match just yet.</h3>
          <p>Try a different make, model, or price range.</p>
          <button className="button secondary" onClick={() => setFilters(empty)}>
            Clear all filters
          </button>
        </div>
      ) : (
        (!user || status === 'ready') && (
          <>
            <div className="result-count">
              {display.length.toString().padStart(2, '0')}{' '}
              {user ? 'VEHICLES IN YOUR COLLECTION' : 'SELECTED VEHICLES'}{' '}
              <span>{isDemo ? 'ILLUSTRATIVE DEMO INVENTORY' : 'CURRENT INVENTORY'}</span>
            </div>
            <div className="vehicle-grid">
              {display.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  onOpen={setSelected}
                  onPurchase={user ? startPurchase : setPurchase}
                  busy={busy && purchase?.id === v.id}
                />
              ))}
            </div>
          </>
        )
      )}
      <div className="collection-foot">
        <span>A different perspective on finding your next car.</span>
        <a className="text-link" href="#top">
          Back to top <ArrowUpRight size={17} />
        </a>
      </div>
      {selected && (
        <Modal
          title={`${selected.make} ${selected.model} details`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="detail-layout">
            <div className="detail-photo">
              <VehicleImage vehicle={selected} />
              <span className="photo-note">Illustrative sample photography</span>
            </div>
            <div className="detail-copy">
              <p className="eyebrow">
                {selected.year} · {selected.category}
              </p>
              <h2>
                {selected.make}
                <br />
                <em>{selected.model}</em>
              </h2>
              <p className="muted">
                {selected.description || 'Discover this vehicle in the AutoBest collection.'}
              </p>
              <div className="detail-specs">
                {[
                  ['Transmission', selected.transmission],
                  ['Fuel', selected.fuel],
                  [
                    'Mileage',
                    selected.mileage != null
                      ? `${Number(selected.mileage).toLocaleString()} km`
                      : null,
                  ],
                  ['Exterior', selected.color],
                  ['Manufacture year', selected.year],
                  ['Registration', selected.registrationYear || selected.year],
                  ['Ownership', selected.owners || 'Single Owner'],
                  ['Engine', selected.engine],
                  ['Power', selected.power],
                  ['Torque', selected.torque],
                  ['Availability', `${selected.quantity} in stock`],
                ]
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <strong>{v || 'Not provided'}</strong>
                    </div>
                  ))}
              </div>
              <div className="detail-price">
                <span>{money(selected.price)}</span>
                <small>
                  {formatIndianLakhsCrores(selected.price)
                    ? `${formatIndianLakhsCrores(selected.price)} · `
                    : ''}
                  INR listed vehicle price
                </small>
              </div>
              {user ? (
                <button
                  className="button primary w-full"
                  disabled={!selected.quantity}
                  onClick={() => startPurchase(selected)}
                >
                  {selected.quantity ? 'Purchase vehicle' : 'Out of stock'}
                  <ArrowRight size={18} />
                </button>
              ) : (
                <Link className="button primary" to="/login">
                  Sign in to purchase <ArrowRight size={18} />
                </Link>
              )}
              <small className="muted block mt-3">
                {isDemo
                  ? 'Demo purchase only. No payment is collected.'
                  : 'Purchase records one vehicle from available inventory.'}
              </small>
            </div>
          </div>
        </Modal>
      )}
      {purchase && (
        <Modal
          title="Confirm purchase"
          onClose={() => {
            if (!busy) {
              setPurchase(null);
              setError('');
            }
          }}
        >
          <div className="modal-content">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <h2>{user ? 'Make it yours.' : 'Enter the showroom.'}</h2>
            {user ? (
              <form onSubmit={confirmPurchase}>
                <p>
                  Purchase one {purchase.year} {purchase.make} {purchase.model} for{' '}
                  <strong>{money(purchase.price)}</strong>
                  {formatIndianLakhsCrores(purchase.price)
                    ? ` (${formatIndianLakhsCrores(purchase.price)})`
                    : ''}
                  ?
                </p>
                <p className="muted">
                  {isDemo
                    ? 'This is a demo. No money will be charged.'
                    : 'Enter your details to complete your purchase. No online payment is collected.'}
                </p>
                <div className="grid gap-4 mt-6">
                  <Field
                    label="Full name"
                    name="purchase-name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={customer.name}
                    disabled={busy}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                  <Field
                    label="Email"
                    name="purchase-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={customer.email}
                    disabled={busy}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                  <Field
                    label="Address"
                    name="purchase-address"
                    autoComplete="street-address"
                    required
                    maxLength={1000}
                    value={customer.address}
                    disabled={busy}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  />
                </div>
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
                <div className="flex gap-3 mt-6">
                  <button
                    className="button secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => setPurchase(null)}
                  >
                    Cancel
                  </button>
                  <button className="button primary" type="submit" disabled={busy}>
                    {busy ? 'Processing…' : 'Confirm purchase'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p>Sign in to view availability and purchase vehicles.</p>
                <Link className="button primary mt-6" to="/login">
                  Sign in <ArrowRight size={17} />
                </Link>
              </>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
