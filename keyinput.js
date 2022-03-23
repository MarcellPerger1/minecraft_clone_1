export class KeyInputMode {
  AUTO = 0;
  KEY = 1;
  CODE = 2;
}


export class KeyInput {
  constructor(){
    // using event.code
    this.code_funcs = [];
    // using event.key
    this.key_funcs = [];
  }

  add_func(func, mode=KeyInput.AUTO){
    
  }
}