exports.a = function a(v) {
  var x = v;
  if(v) {
    x += v * x;
  } else {
    x += x * x - 3;
  }
  return x;
}
