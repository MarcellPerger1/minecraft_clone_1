/**
 * Trim chars from string
 * @param {string} str
 * @param {string} chars - chars to trim
 * @param {?({start?: boolean, end?: boolean})} opts
 * @param {boolean} opts.start - trim from start?
 * @param {boolean} opts.end - trim from end?
 */
export function trim(str, chars, opts = null) {
  var start = 0,
    end = str.length;

  if (opts?.start) {
    while (start < end && chars.includes(str[start])) ++start;
  }

  if (opts?.end) {
    while (end > start && chars.includes(str[end - 1])) --end;
  }

  return start > 0 || end < str.length ? str.substring(start, end) : str;
}

export function removePrefix(
  /**@type{string}*/ str,
  /**@type{string}*/ prefix
) {
  if (str.startsWith(prefix)) {
    str = str.substring(prefix.length);
  }
  return str;
}

export function removeSuffix(
  /**@type{string}*/ str,
  /**@type{string}*/ suffix
) {
  if (str.endsWith(suffix)) {
    str = str.substring(0, str.length - suffix.length);
  }
  return str;
}
