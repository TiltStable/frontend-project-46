const escapeText = (text) => {
  const needsEscaping = [...text].some((ch) => {
    const code = ch.charCodeAt(0);
    return code < 32 || (code >= 127 && code <= 159) || code === 0x2028 || code === 0x2029;
  });
  if (!needsEscaping) return text;
  return JSON.stringify(text)
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029")
    .replaceAll("\u0085", "\\u0085");
};

const stringifyValueGuarded = (value, space) =>
  JSON.stringify(
    value,
    (key, nested) => {
      if (typeof nested === "number" && !Number.isFinite(nested)) {
        throw new Error(`Value is not representable in diff output: ${nested}`);
      }
      return nested;
    },
    space,
  );

export { escapeText, stringifyValueGuarded };
