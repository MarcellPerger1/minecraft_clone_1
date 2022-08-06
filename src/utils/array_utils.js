import { numCmp } from './math.js';
import {isAnyArray} from './type_check.js';

// may modify list inplace, but doesnt have to
export function iextend(a, b){
  if(b.length < 32_000){
    a.push(...b);
    return a;
  }
  if(a.length < b.length/2){
    // a much smaller than b -  use concat (copy not too expensive)
    return a.concat(b);
  }
  if(b.length < a.length/2){
    // b much smaller - just use a loop
    for(const v of b){
      a.push(v);
    }
    return a;
  }
  return a.concat(b);
}

export function extendNullSafe(a, ...args){
  for(const other of args){
    if(other==null){ continue; }
    for(const v of other){
      if(v==null){ continue; }
      a.push(v);
    }
  }
  return a;
}

export function assignNullSafe(a, ...args){
  for(const other of args){
    if(other==null){ continue; }
    for(const [k, v] of Object.entries(other)){
      a[k] = v ?? a[k];
    }
  }
  return a;
}

export function setDefaults(a, ...args){
  for(const other of args){
    if(other==null){continue;}
    for(const [k, v] of Object.entries(other)){
      a[k] ??= v;
    }
  }
}

export function sortCoords(p0, p1){
  let len = p0.length;
  if(p0.length != p1.length){
    throw new RangeError("Arrays must be same len");
  }
  for(let i=0;i<len;i++){
    if(p0[i] > p1[i]){
    [p0[i], p1[i]] = [p1[i], p0[i]];
  }
  }
  return [p0, p1];
}

export function forRange(n, func, thisArg=null){
  return Array.from({length: n}, (_v, i) => func.call(thisArg, i));
}

export function fromNested(shape, func, thisArg=null){
  var path = [];
  let inner = (i) => {
    var value;
    path.push(i);
    if(path.length == shape.length){
      value = func.call(thisArg, path.slice());
    } else {
      value = forRange(shape[path.length], inner);
    }
    path.pop();
    return value;
  }
  return forRange(shape[0], inner);
}

export function nestedFor(arr, func, thisArg=null, path_prefix=[]){
  var path = path_prefix.slice();
  arr.forEach((v, i, a) => {
    let p = path.concat(i);
    if(isAnyArray(v)){
      nestedFor(v, func, thisArg, p);
    } else {
      func.call(thisArg, v, p, arr, a);  // throw eveything at the function
    }
  })
}

/**
 * Similar to python range(n), returns integers 0 to n (end exculsive)
 * @param {number} n
 * @returns {Array<number>}
 */
export function rangeList(n){
  return [...Array(n).keys()];
}


/**
 * Binary search
 * @template T, S
 * @param {Array<T>} list
 * @param {S} item
 * @param {(item: S, v: T) => (0|1|-1)} threeWayCmp -1=>i<v,0=>i==v,+1=>i>v
 * @returns {number} index if found; else -1
 */
export function binarySearch(list, item, threeWayCmp) {
  threeWayCmp ??= numCmp;
  var lo = 0;
  var hi = list.length;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    let cmpRes = threeWayCmp(item, list[mid]);
    if (cmpRes === 0) {
      return mid;
    }
    if (cmpRes < 0) {
      hi = mid - 1;
    } else {
      // cmpRes > 0
      lo = mid + 1
    }
  }
  return -1;
}
