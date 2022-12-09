// Load text from <script> element id
export function loadTextFromTag(id){
  const vse = document.getElementById(id);
  return vse.innerText;
}

export async function fetchResponse(path) {
  if(path.startsWith('/')) {
    console.warn("Using absolute paths that will not work when used with github pages or nodejs")
  }
  // todo use XMLHttpRequest for progress event (only needed when bigger files)
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`cant load resource at ${path}`);
  }
  return response;
}

export async function fetchTextFile(path){
  return (await fetchResponse(path)).text();
}

export async function fetchJsonFile(path){
  return (await fetchResponse(path)).json();
}

/**
 * Returns a new URL identical to given one except with server caching disabled
 * @param {string} url - Original URL
 * @returns {string} URL with caching disabled
 */
export function disableCaching(url){
  return url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
}

