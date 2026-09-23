import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordField = ({ label = 'Password', value, onChange, autoComplete, required = true, ...props }) => {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="password-field-label" htmlFor={inputId}>
      {label}
      <span className="password-field">
        <input
          id={inputId}
          value={value}
          onChange={onChange}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          {...props}
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
};
