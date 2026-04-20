// src/utils/validate.js — central validation + sanitization

export const sanitizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/<[^>]*>/g, '').replace(/[ \t]+/g, ' ').trim();
};

export const parseAmount = (raw) => {
  const n = parseFloat(String(raw).trim().replace(/,/g, ''));
  if (!isFinite(n)) return { ok: false, message: 'Amount must be a valid number' };
  if (n <= 0)       return { ok: false, message: 'Amount must be greater than 0' };
  if (n > 9999999)  return { ok: false, message: 'Amount is unrealistically large' };
  return { ok: true, value: Math.round(n * 100) / 100 };
};

export const validateEmail = (email) => {
  const cleaned = sanitizeText(email).toLowerCase();
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(cleaned)) return { ok: false, message: 'Enter a valid email address' };
  if (cleaned.length > 254) return { ok: false, message: 'Email is too long' };
  return { ok: true, value: cleaned };
};

export const validatePassword = (password) => {
  if (typeof password !== 'string') return { ok: false, message: 'Password is required' };
  if (password.length < 8)  return { ok: false, message: 'Password must be at least 8 characters' };
  if (password.length > 72) return { ok: false, message: 'Password is too long' };
  if (!/[a-zA-Z]/.test(password)) return { ok: false, message: 'Password must contain at least one letter' };
  if (!/[0-9]/.test(password))    return { ok: false, message: 'Password must contain at least one number' };
  return { ok: true };
};

export const validateName = (name, { label = 'Name', min = 2, max = 80 } = {}) => {
  const cleaned = sanitizeText(name);
  if (!cleaned)             return { ok: false, message: `${label} is required` };
  if (cleaned.length < min) return { ok: false, message: `${label} must be at least ${min} characters` };
  if (cleaned.length > max) return { ok: false, message: `${label} must be under ${max} characters` };
  if (/[<>"'`;\\]/.test(cleaned)) return { ok: false, message: `${label} contains invalid characters` };
  return { ok: true, value: cleaned };
};

export const validateMessCode = (code) => {
  const cleaned = String(code).trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(cleaned))
    return { ok: false, message: 'Mess code must be exactly 6 characters (letters and numbers)' };
  return { ok: true, value: cleaned };
};

export const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return { ok: true, value: '' };
  const cleaned = sanitizeText(phone).replace(/\s/g, '');
  if (!/^\+?[0-9-]{7,15}$/.test(cleaned))
    return { ok: false, message: 'Enter a valid phone number' };
  return { ok: true, value: cleaned };
};

export const validateDescription = (text, { label = 'Description', max = 500 } = {}) => {
  const cleaned = sanitizeText(text);
  if (!cleaned)             return { ok: false, message: `${label} is required` };
  if (cleaned.length > max) return { ok: false, message: `${label} must be under ${max} characters` };
  return { ok: true, value: cleaned };
};

export const validateDate = (dateStr, { allowFuture = false } = {}) => {
  if (!dateStr) return { ok: false, message: 'Date is required' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { ok: false, message: 'Invalid date' };
  if (!allowFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) return { ok: false, message: 'Date cannot be in the future' };
  }
  if (d.getFullYear() < 2020) return { ok: false, message: 'Date is too far in the past' };
  return { ok: true, value: dateStr };
};
