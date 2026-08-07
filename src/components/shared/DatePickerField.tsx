interface DatePickerFieldProps {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}

export default function DatePickerField({ id, label, value, min, onChange }: DatePickerFieldProps) {
  return (
    <div className="date-picker-field">
      <label className="date-picker-label" htmlFor={id}>
        {label}
      </label>
      <div className="date-picker-control">
        <input
          className="date-picker-input"
          id={id}
          type="date"
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <svg className="date-picker-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
          <path d="M8 3.5v4M16 3.5v4M3.5 10h17" />
          <path d="M8 14h2M14 14h2M8 17.5h2M14 17.5h2" />
        </svg>
      </div>
    </div>
  );
}
