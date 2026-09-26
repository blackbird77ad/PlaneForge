import { useEffect, useMemo, useState } from 'react';
import {
  countryCallingCodes,
  digitsOnly,
  findCountryByDialCode,
  formatContactNumber,
  getCountryLengthLabel,
  parseContactNumber
} from '../utils/contactNumber.js';

export const PhoneNumberField = ({
  value,
  onChange,
  label = 'Contact number',
  required = false,
  disabled = false
}) => {
  const initialDialCode = parseContactNumber(value).dialCode;
  const [dialCode, setDialCode] = useState(initialDialCode);

  useEffect(() => {
    const parsed = parseContactNumber(value, dialCode);
    if (value && parsed.dialCode !== dialCode) {
      setDialCode(parsed.dialCode);
    }
  }, [dialCode, value]);

  const country = useMemo(() => findCountryByDialCode(dialCode), [dialCode]);
  const maxLength = country.maxLength || Math.max(...(country.lengths || [15]));
  const nationalNumber = parseContactNumber(value, dialCode).nationalNumber.slice(0, maxLength);

  const updateDialCode = (nextDialCode) => {
    const nextCountry = findCountryByDialCode(nextDialCode);
    const nextMaxLength = nextCountry.maxLength || Math.max(...(nextCountry.lengths || [15]));
    setDialCode(nextDialCode);
    onChange(formatContactNumber({ dialCode: nextDialCode, nationalNumber: nationalNumber.slice(0, nextMaxLength) }));
  };

  const updateNationalNumber = (nextValue) => {
    const digits = digitsOnly(nextValue).slice(0, maxLength);
    onChange(formatContactNumber({ dialCode, nationalNumber: digits }));
  };

  return (
    <label className="phone-number-field">
      {label}
      <div className="phone-input-row">
        <select
          value={dialCode}
          onChange={(event) => updateDialCode(event.target.value)}
          disabled={disabled}
          aria-label={`${label} country code`}
        >
          {countryCallingCodes.map((item) => (
            <option value={item.dialCode} key={`${item.iso}-${item.dialCode}`}>
              {item.country} {item.dialCode}
            </option>
          ))}
        </select>
        <input
          value={nationalNumber}
          onChange={(event) => updateNationalNumber(event.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={maxLength}
          placeholder={country.placeholder}
          required={required}
          disabled={disabled}
        />
      </div>
      <span className="form-muted">
        Enter {getCountryLengthLabel(country)} digits after {country.dialCode}; numbers only.
      </span>
    </label>
  );
};
