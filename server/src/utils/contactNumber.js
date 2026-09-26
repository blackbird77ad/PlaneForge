import { ApiError } from './apiError.js';

const countryCallingCodes = [
  { country: 'Ghana', dialCode: '+233', lengths: [9] },
  { country: 'United States / Canada', dialCode: '+1', lengths: [10] },
  { country: 'United Kingdom', dialCode: '+44', lengths: [10] },
  { country: 'Nigeria', dialCode: '+234', lengths: [10] },
  { country: 'Kenya', dialCode: '+254', lengths: [9] },
  { country: 'South Africa', dialCode: '+27', lengths: [9] },
  { country: 'India', dialCode: '+91', lengths: [10] },
  { country: 'United Arab Emirates', dialCode: '+971', lengths: [9] },
  { country: 'Australia', dialCode: '+61', lengths: [9] },
  { country: 'Brazil', dialCode: '+55', lengths: [10, 11] },
  { country: 'Germany', dialCode: '+49', minLength: 5, maxLength: 11 },
  { country: 'France', dialCode: '+33', lengths: [9] },
  { country: 'Netherlands', dialCode: '+31', lengths: [9] },
  { country: 'Iceland', dialCode: '+354', lengths: [7] }
];

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const findCountry = (value) =>
  [...countryCallingCodes]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((item) => value.startsWith(item.dialCode));

const lengthLabel = (country) => {
  if (country.lengths?.length) return country.lengths.join(' or ');
  return `${country.minLength}-${country.maxLength}`;
};

export const normalizeContactNumber = (value) => {
  const raw = String(value || '').trim();
  const normalized = raw.startsWith('00')
    ? `+${digitsOnly(raw.slice(2))}`
    : raw.startsWith('+')
      ? `+${digitsOnly(raw.slice(1))}`
      : digitsOnly(raw);

  if (!/^\+[1-9]\d{5,14}$/.test(normalized)) {
    throw new ApiError(400, 'Choose a country code and enter numbers only for the contact number');
  }

  const country = findCountry(normalized);
  if (!country) {
    throw new ApiError(400, 'Choose a supported country code for the contact number');
  }

  const nationalNumber = normalized.slice(country.dialCode.length);
  const length = nationalNumber.length;

  if (country.lengths?.length && !country.lengths.includes(length)) {
    throw new ApiError(400, `${country.country} numbers must be ${lengthLabel(country)} digits after ${country.dialCode}`);
  }

  if (country.minLength && country.maxLength && (length < country.minLength || length > country.maxLength)) {
    throw new ApiError(400, `${country.country} numbers must be ${lengthLabel(country)} digits after ${country.dialCode}`);
  }

  return normalized;
};
