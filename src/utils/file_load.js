// Load text from <script> element id
export function loadTextFromTag(id){
  const vse = document.getElementById(id);
  return vse.innerText;
}

export async function fetchTextFile(path){
  // todo use XMLHttpRequest for progress event (only needed when bigger files)
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`cant load resource at ${path}`);
  }
  return response.text();
}

export async function fetchJsonFile(path){
  // todo use XMLHttpRequest for progress event (only needed when bigger files)
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`cant load resource at ${path}`);
  }
  return response.json();
}

/**
 * Returns a new URL identical to given one except with server caching disabled
 * @param {string} url - Original URL
 * @returns {string} URL with caching disabled
 */
export function disableCaching(url){
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
}

