export default function Field({ label, error, id, ...props }) {
  const name = id || props.name;
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        {...props}
        id={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <small className="field-error" id={`${name}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
