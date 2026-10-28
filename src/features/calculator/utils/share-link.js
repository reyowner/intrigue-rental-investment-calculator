import { INPUT_GROUPS } from '../constants/input-fields.js';
import { readInputValues } from './input-values.js';

const names = INPUT_GROUPS.flatMap(group => group.fields.map(field => field.name));

/** Assumptions only. Anyone with the link can view these numbers; it is not encrypted. */
export function encodeDealLink(inputs, baseUrl) {
  const url = new URL(baseUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new TypeError('Use an HTTP(S) URL without credentials.');
  url.search = '';
  const values = names.map(name => name.split('.').reduce((value, key) => value?.[key], inputs));
  if (!values.every(safeValue)) throw new TypeError('Provide all 40 raw decimal assumptions, at most 64 characters each.');
  url.hash = `deal=${base64url(JSON.stringify({v: 1, values}))}`;
  return url.href;
}

// Transport safety only: blank values and financially out-of-range decimals
// are intentionally left for the existing engine after restoration.
const safeValue = value => typeof value === 'string' && value.length <= 64
  && /^[\t ]*[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?[\t ]*$/i.test(value)
  || typeof value === 'string' && value.length <= 64 && /^[\t ]*$/.test(value);
const base64url = text => btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function decodeDealLink(url) {
  try {
    const fragment = new URL(url).hash;
    if (!/^#deal(?:=|$)/.test(fragment)) return {status: 'none'};
    if (fragment.length > 4102 || !/^#deal=[A-Za-z0-9_-]+$/.test(fragment)) throw new Error();
    const token = fragment.slice(6);
    const text = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    if (base64url(text) !== token) throw new Error();
    const payload = JSON.parse(text);
    if (!payload || JSON.stringify(payload) !== text || Object.keys(payload).sort().join(',') !== 'v,values'
      || payload.v !== 1 || !Array.isArray(payload.values) || payload.values.length !== names.length
      || !payload.values.every(safeValue)) throw new Error();
    return {status: 'valid', inputs: readInputValues(names.map((name, index) => [name, payload.values[index]]))};
  } catch {
    return {status: 'invalid', message: 'This deal link is invalid or unsupported. Your current numbers have not been changed.'};
  }
}
