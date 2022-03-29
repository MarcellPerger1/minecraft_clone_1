// Load text from <script> element id
export function loadTextFromTag(id){
  const vse = document.getElementById(id);
  return vse.innerText;
}

export function fetchTextFile(path){
  // todo use XMLHttpRequest for progress event (only needed when bigger files)
  return fetch(path).then(response => {
    if(!response.ok){
      throw new Error("cant load resource")
    }
    return response.text();
  })
  .catch(reason => {
    console.error(reason)
    throw reason;
  })
}
