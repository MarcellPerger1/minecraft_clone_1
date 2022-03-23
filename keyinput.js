export class KeyInput {
  constructor(){
    // funcs: [[event, func], ...]  (more flexible & extensible this way)
    this.funcs = [];
    this.key_down = {};
    this.code_down = {};
  }

  addFunc(event, func){
    this.funcs.push([event, func]);
    return this;
  }

  keydown(e){
    this.key_down[e.key] = true;
    this.code_down[e.code] = true;
  }

  keyup(e){
    this.key_down[e.key] = false;
    this.code_down[e.code] = false;
  }

  tick(deltaT){
    for(const [event, func] of this.funcs){
      if(event.shouldTrigger(this)){
        func(deltaT);
      }
    }
  }
}


export class BaseKeyEvent {
  shouldTrigger(ki){
    throw new ReferenceError('KeyEvents should override shouldTrigger');
  }
}

export class KeyEvent extends BaseKeyEvent {
  static AUTO = 0;
  static KEY = 1;  // eg. 'h' or 'H' (affected by Shift/CapsLock)
  // recommended:
  static CODE = 2; // eg. 'KeyH'     (for keybinds - NOT text editing)
  
  constructor(event_str, mode=KeyEvent.AUTO){
    super()
    mode ??= KeyEvent.AUTO
    if(mode == KeyEvent.AUTO){
      [mode, event_str] = this.getAutoEvent(event_str);
    }
    this.mode = mode;
    this.event_str = event_str;
  }
  
  shouldTrigger(ki){
    var down_o = this.mode == this.KEY ? ki.key_down : ki.code_down;
    return down_o[this.event_str] ?? false;
  }

  getAutoEvent(event_str){
    if(event_str.length==1){
      return [KeyEvent.CODE, 'Key'+event_str.toUpperCase()];
    }
    return [KeyEvent.CODE, event_str];
  }
}
