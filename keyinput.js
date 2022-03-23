export class KeyInput {
  constructor(){
    // funcs: [[event, func], ...]  (more flexible & extensible this way)
    this.funcs = [];
    this.key_down = [];
    this.code_down = [];
  }

  add_func(func, event){
    (this.funcs[event] ??= []).push(func);
    return this;
  }

  keydown(e){
    this.key_down[e.key] = true;
    this.code_down[e.key] = true;
  }

  key_up(e){
    this.key_down[e.key] = false;
    this.code_down[e.key] = false;
  }

  tick(){
    for(const [event, func] of this.funcs){
      if(event.shouldTrigger(this)){
        func();
      }
    }
  }
}


class BaseKeyEvent {
  shouldTrigger(ki){
    throw new ReferenceError('KeyEvents should override shouldTrigger');
  }
}

class KeyEvent extends BaseKeyEvent {
  AUTO = 0;
  KEY = 1;  // eg. 'h' or 'H' (affected by Shift/CapsLock)
  // recommended:
  CODE = 2; // eg. 'KeyH'     (for keybinds - NOT text editing)
  
  constructor(event_str, mode=KeyEvent.AUTO){
    mode ??= KeyEvent.AUTO
    if(mode == KeyEvent.AUTO){
      mode = this.getAutoMode(event_str);
    }
    this.mode = mode;
    this.event_str = event_str;
  }
  
  shouldTrigger(ki){
    var down_o = this.mode == this.KEY ? ki.key_down : ki.code_down;
    return down_o[this.event_str] ?? false;
  }

  getAutoMode(event){
    if(event.startsWith('Key')){
      return KeyEvent.CODE;
    } 
    if(event.length==1){
      return KeyEvent.KEY;
    }
    return KeyEvent.CODE;
  }
}
