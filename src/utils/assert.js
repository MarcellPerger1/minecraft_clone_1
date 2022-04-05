export var ASSERT_SETTINGS = {
  log: true,
  error: true,
};

export function assert(condition, msg=null){
  if(!condition){
    msg ??= "Assertion condition not met";
    if(ASSERT_SETTINGS.log){
      console.log(msg);
    }
    if(ASSERT_SETTINGS.error){
      throw new Error(msg);
    }
  }
}

export function unreachable(msg=null){
  assert(0, msg ?? "Unreachable code reached! Program should never reach here.");
}
