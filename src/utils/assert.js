export function assert(condition, msg=null){
  if(!condition){
    msg ??= "Assertion condition not met";
    console.log(msg);
    throw new Error(msg);
  }
}