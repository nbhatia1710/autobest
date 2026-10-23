import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, PackagePlus, ArrowLeft, Search } from 'lucide-react';
import { useAuth, isDemo } from '../lib/auth';
import { money } from '../lib/seed';
import { validateVehicle } from '../lib/validation';
import { VehicleImage } from './VehicleCard';
import Modal from './Modal';
import Field from './Field';
const blank = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  category: 'Sedan',
  price: '',
  quantity: 0,
  image: '',
  fuel: 'Petrol',
  transmission: 'Automatic',
  color: '',
  mileage: '',
  description: '',
};
function VehicleForm({ vehicle, onSave, busy, error }) {
  const [value, setValue] = useState(vehicle || blank),
    [errors, setErrors] = useState({});
  function submit(e) {
    e.preventDefault();
    const errors = validateVehicle(value);
    setErrors(errors);
    if (Object.keys(errors).length) return;
    onSave({
      ...value,
      make: value.make.trim(),
      model: value.model.trim(),
      price: Number(value.price),
      quantity: Number(value.quantity),
      year: Number(value.year),
      mileage: value.mileage === '' ? null : Number(value.mileage),
    });
  }
  return (
    <form onSubmit={submit} className="modal-content" noValidate>
      <p className="eyebrow">INVENTORY MANAGEMENT</p>
      <h2>{vehicle ? 'Refine the details.' : 'A new addition.'}</h2>
      <p className="muted">All prices are in USD. Fields marked * are required.</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="form-two-col">
        {[
          ['make', 'Make *', 'text'],
          ['model', 'Model *', 'text'],
          ['year', 'Manufacture year *', 'number'],
          ['price', 'Price (USD) *', 'number'],
          ['quantity', 'Quantity in stock *', 'number'],
          ['mileage', 'Mileage (km)', 'number'],
        ].map(([key, label, type]) => (
          <Field
            key={key}
            name={key}
            label={label}
            type={type}
            min={key === 'year' ? 1886 : 0}
            step={key === 'price' ? '0.01' : '1'}
            value={value[key] ?? ''}
            error={errors[key]}
            onChange={(e) => setValue({ ...value, [key]: e.target.value })}
          />
        ))}
        {[
          ['category', ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Convertible', 'Truck']],
          ['fuel', ['Petrol', 'Diesel', 'Electric', 'Hybrid']],
          ['transmission', ['Automatic', 'Manual']],
        ].map(([key, options]) => (
          <label className="field" key={key}>
            <span>
              {key[0].toUpperCase() + key.slice(1)}
              {key === 'category' ? ' *' : ''}
            </span>
            <select
              value={value[key] || options[0]}
              onChange={(e) => setValue({ ...value, [key]: e.target.value })}
            >
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
        ))}
        <Field
          name="color"
          label="Exterior color"
          value={value.color || ''}
          onChange={(e) => setValue({ ...value, color: e.target.value })}
        />
      </div>
      <Field
        name="image"
        label="Photo URL (HTTPS or /media/ path)"
        value={value.image || ''}
        error={errors.image}
        onChange={(e) => setValue({ ...value, image: e.target.value })}
      />
      <label className="field mt-4">
        <span>Description</span>
        <textarea
          rows="3"
          value={value.description || ''}
          onChange={(e) => setValue({ ...value, description: e.target.value })}
        />
      </label>
      <button className="button primary mt-6 w-full" disabled={busy}>
        {busy ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}
      </button>
    </form>
  );
}
export default function Admin() {
  const { user, api } = useAuth();
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [amount, setAmount] = useState(1),
    [query, setQuery] = useState(''),
    [reload, setReload] = useState(0);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    let active = true;
    setLoading(true);
    api
      .list({})
      .then((data) => {
        if (active) {
          setRows(Array.isArray(data) ? data : data.items);
          setError('');
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api, user, reload]);
  if (user?.role !== 'admin')
    return (
      <main className="section-shell access-denied">
        <h1>Administrator access required.</h1>
        <Link className="button primary" to="/inventory">
          Return to collection
        </Link>
      </main>
    );
  function open(type, vehicle) {
    setError('');
    setNotice('');
    setAmount(1);
    setModal({ type, vehicle });
  }
  async function act(value) {
    setBusy(true);
    setError('');
    try {
      if (modal.type === 'add') await api.add(value);
      if (modal.type === 'edit') await api.update(modal.vehicle.id, value);
      if (modal.type === 'delete') await api.remove(modal.vehicle.id);
      if (modal.type === 'restock') {
        if (!Number.isSafeInteger(Number(amount)) || Number(amount) < 1)
          throw new Error('Enter a positive whole number.');
        await api.restock(modal.vehicle.id, Number(amount));
      }
      setNotice(`${isDemo ? 'Demo inventory' : 'Inventory'} updated successfully.`);
      setModal(null);
      setReload((n) => n + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows.filter((v) =>
    `${v.make} ${v.model}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="admin-page section-shell">
      <Link to="/inventory" className="back-link">
        <ArrowLeft size={16} /> Back to showroom
      </Link>
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE OPERATIONS DESK</p>
          <h1>
            Your inventory.
            <br />
            <em>Under control.</em>
          </h1>
        </div>
        <button className="button primary" onClick={() => open('add')}>
          <Plus size={18} /> Add vehicle
        </button>
      </div>
      <div className="admin-stats">
        {[
          ['Vehicle listings', rows.length],
          ['Units in stock', rows.reduce((n, v) => n + v.quantity, 0)],
          ['Low-stock listings', rows.filter((v) => v.quantity > 0 && v.quantity <= 2).length],
          ['Out of stock', rows.filter((v) => !v.quantity).length],
        ].map(([title, n]) => (
          <div key={title}>
            <span>{title}</span>
            <strong>{String(n).padStart(2, '0')}</strong>
          </div>
        ))}
      </div>
      {notice && (
        <p role="status" className="success-message">
          {notice}
        </p>
      )}
      {error && !modal && (
        <p role="alert" className="error">
          {error} <button onClick={() => setReload((n) => n + 1)}>Retry</button>
        </p>
      )}
      <label className="search-input admin-search">
        <Search size={18} />
        <input
          aria-label="Search inventory"
          placeholder="Search your inventory…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {loading ? (
        <p role="status">Loading inventory…</p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Vehicle inventory and management actions</caption>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Year / category</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="table-car">
                      <VehicleImage vehicle={v} />
                      <div>
                        <strong>{v.make}</strong>
                        <span>{v.model}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {v.year}
                    <small>{v.category}</small>
                  </td>
                  <td>{money(v.price)}</td>
                  <td>
                    <span className={`table-stock ${v.quantity <= 2 ? 'low' : ''}`}>
                      {v.quantity} units
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        aria-label={`Edit ${v.model}`}
                        title="Edit"
                        onClick={() => open('edit', v)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        aria-label={`Restock ${v.model}`}
                        title="Restock"
                        onClick={() => open('restock', v)}
                      >
                        <PackagePlus size={18} />
                      </button>
                      <button
                        aria-label={`Delete ${v.model}`}
                        title="Delete"
                        onClick={() => open('delete', v)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="empty-state">
              <h3>No vehicles found.</h3>
              <p>Add a vehicle or adjust your search.</p>
            </div>
          )}
        </div>
      )}
      {modal && (
        <Modal
          title={`${modal.type} vehicle`}
          onClose={() => {
            if (!busy) {
              setModal(null);
              setError('');
            }
          }}
        >
          {['add', 'edit'].includes(modal.type) ? (
            <VehicleForm vehicle={modal.vehicle} onSave={act} busy={busy} error={error} />
          ) : (
            <div className="modal-content">
              <p className="eyebrow">INVENTORY MANAGEMENT</p>
              <h2>{modal.type === 'delete' ? 'Remove this vehicle?' : 'Ready for more.'}</h2>
              <p>
                {modal.vehicle.make} {modal.vehicle.model}
              </p>
              {modal.type === 'delete' ? (
                <p className="muted">
                  This will remove the listing from inventory. This action cannot be undone.
                </p>
              ) : (
                <>
                  <p className="muted">Currently {modal.vehicle.quantity} in stock.</p>
                  <Field
                    name="restock"
                    label="Units to add"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setModal(null);
                    setError('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className={`button ${modal.type === 'delete' ? 'danger' : 'primary'}`}
                  disabled={busy}
                  onClick={() => act()}
                >
                  {busy
                    ? 'Updating…'
                    : modal.type === 'delete'
                      ? 'Delete vehicle'
                      : 'Confirm restock'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}
