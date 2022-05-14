/**
 * Trim chars from string
 * @param {string} str
 * @param {string} chars - chars to trim
 * @param {?({start: boolean, end: boolean})} opts
 * @param {boolean} opts.start - trim from start?
 * @param {boolean} opts.end - trim from end?
 */
export function trim(str, chars, opts=null) {
  var start = 0, end = str.length;

  if(opts?.start){
    while(start < end && chars.includes(str[start]))
      ++start;
  }

  if(opts?.end){
    while(end > start && chars.includes(str[end - 1]))
      --end;
  }

  return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}
