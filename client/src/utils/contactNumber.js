export const countryCallingCodes = [
  { iso: 'GH', country: 'Ghana', dialCode: '+233', lengths: [9], placeholder: '501234567' },
  { iso: 'US', country: 'United States / Canada', dialCode: '+1', lengths: [10], placeholder: '5551234567' },
  { iso: 'GB', country: 'United Kingdom', dialCode: '+44', lengths: [10], placeholder: '7123456789' },
  { iso: 'NG', country: 'Nigeria', dialCode: '+234', lengths: [10], placeholder: '8012345678' },
  { iso: 'KE', country: 'Kenya', dialCode: '+254', lengths: [9], placeholder: '712345678' },
  { iso: 'ZA', country: 'South Africa', dialCode: '+27', lengths: [9], placeholder: '721234567' },
  { iso: 'IN', country: 'India', dialCode: '+91', lengths: [10], placeholder: '9876543210' },
  { iso: 'AE', country: 'United Arab Emirates', dialCode: '+971', lengths: [9], placeholder: '501234567' },
  { iso: 'AU', country: 'Australia', dialCode: '+61', lengths: [9], placeholder: '412345678' },
  { iso: 'BR', country: 'Brazil', dialCode: '+55', lengths: [10, 11], placeholder: '11987654321' },
  { iso: 'DE', country: 'Germany', dialCode: '+49', minLength: 5, maxLength: 11, placeholder: '15123456789' },
  { iso: 'FR', country: 'France', dialCode: '+33', lengths: [9], placeholder: '612345678' },
  { iso: 'NL', country: 'Netherlands', dialCode: '+31', lengths: [9], placeholder: '612345678' },
  { iso: 'IS', country: 'Iceland', dialCode: '+354', lengths: [7], placeholder: '6123456' }
];

const defaultCountry = countryCallingCodes[0];

export const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const findCountryByDialCode = (dialCode) =>
  countryCallingCodes.find((item) => item.dialCode === dialCode) || defaultCountry;

export const parseContactNumber = (value, fallbackDialCode = defaultCountry.dialCode) => {
  const raw = String(value || '').trim();
  const compact = raw.startsWith('00')
    ? `+${digitsOnly(raw.slice(2))}`
    : raw.startsWith('+')
      ? `+${digitsOnly(raw.slice(1))}`
      : digitsOnly(raw);

  const matched = [...countryCallingCodes]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((item) => compact.startsWith(item.dialCode));

  const dialCode = matched?.dialCode || fallbackDialCode;
  const nationalNumber = matched
    ? compact.slice(matched.dialCode.length)
    : compact.startsWith('+')
      ? ''
      : compact;

  return {
    dialCode,
    nationalNumber: digitsOnly(nationalNumber)
  };
};

export const formatContactNumber = ({ dialCode, nationalNumber }) => {
  const digits = digitsOnly(nationalNumber);
  return digits ? `${dialCode}${digits}` : '';
};

export const getCountryLengthLabel = (country) => {
  if (country.lengths?.length) return country.lengths.join(' or ');
  if (country.minLength && country.maxLength) return `${country.minLength}-${country.maxLength}`;
  return '6-15';
};

export const getContactNumberError = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'Contact number is required.';
  if (!/^\+[1-9]\d{5,14}$/.test(raw)) {
    return 'Choose a country code and enter numbers only for the contact number.';
  }

  const { dialCode, nationalNumber } = parseContactNumber(raw);
  const country = findCountryByDialCode(dialCode);
  const length = nationalNumber.length;

  if (country.lengths?.length && !country.lengths.includes(length)) {
    return `${country.country} numbers must be ${getCountryLengthLabel(country)} digits after ${country.dialCode}.`;
  }

  if (country.minLength && country.maxLength && (length < country.minLength || length > country.maxLength)) {
    return `${country.country} numbers must be ${getCountryLengthLabel(country)} digits after ${country.dialCode}.`;
  }

  return '';
};
