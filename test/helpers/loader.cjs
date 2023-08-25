const { emitWarning } = process;

// return true if catch
let _shouldPreventExperiWarn = (warning, ..._args) => {
  let wmsg = typeof warning === "string" ? warning : warning.msg;
  let matchStrings = ["VM Modules", "vm-modules"];
  for (let s of matchStrings) {
    if (wmsg.toLowerCase().indexOf(s.toLowerCase()) >= 0) {
      return true;
    }
  }
  return false;
};

let _isExperiWarn = (_warning, ...args) => {
  if (args[0] === "ExperimentalWarning") {
    return true;
  }
  if (
    args[0] &&
    typeof args[0] === "object" &&
    args[0].type === "ExperimentalWarning"
  ) {
    return true;
  }
  return false;
};

process.emitWarning = (...args) => {
  if (_isExperiWarn(...args) && _shouldPreventExperiWarn(...args)) {
    return;
  }
  return emitWarning(...args);
};
