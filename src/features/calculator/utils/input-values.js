import { INPUT_GROUPS } from '../constants/input-fields.js';

/** Keep raw strings, including blanks, for the engine's authoritative validation. */
export function readInputValues(entries) {
  const values = new Map(entries);
  const input = {};
  for (const { fields } of INPUT_GROUPS) {
    for (const { name } of fields) {
      const [key, child] = name.split('.');
      const value = values.has(name) ? values.get(name) : null;
      if (child) {
        input[key] ??= {};
        input[key][child] = value;
      } else input[key] = value;
    }
  }
  return input;
}
