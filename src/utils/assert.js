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