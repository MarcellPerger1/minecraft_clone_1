import {charIsDigit} from './utils.js';

export class KeyInput {
  constructor(){
    // funcs: [[event, func], ...]  (more flexible & extensible this way)
    this.funcs = [];
    this.key_down = {};
    this.code_down = {};
  }

  addFunc(event, func=null){
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

  addListeners(elem=null){
    elem ??= window;
    elem.addEventListener('keydown', (e) => this.keydown(e));
    elem.addEventListener('keyup', (e) => this.keyup(e));
  }

  tick(deltaT){
    for(const [event, func] of this.funcs){
      if(event.shouldTrigger(this)){
        if(func!=null){
          func(deltaT);
        }
      }
    }
  }
  pressed(event_str, mode=KeyEvent.AUTO){
    return new KeyEvent(event_str, mode).shouldTrigger(this);
  }
}


export class BaseKeyEvent {
  shouldTrigger(_ki){
    throw new ReferenceError('KeyEvents should override shouldTrigger');
  }
}

export class KeyEvent extends BaseKeyEvent {
  static AUTO = 0;
  static KEY = 1;  // eg. 'h' or 'H' (affected by Shift/CapsLock)
  // recommended:
  static CODE = 2; // eg. 'KeyH'     (for keybinds - NOT text editing)
  
  constructor(event_str, mode=KeyEvent.AUTO){
    super();
    [event_str, mode] = getEventStr(event_str, mode);
    this.mode = mode;
    this.event_str = event_str;
  }
  
  shouldTrigger(ki){
    var down_o = this.mode == this.KEY ? ki.key_down : ki.code_down;
    return down_o[this.event_str] ?? false;
  }
}

export function getAutoEventStr(event_str){
  if(event_str.length==1){
    let pre = charIsDigit(event_str) ? 'Digit' : 'Key';
    return [pre+event_str.toUpperCase(), KeyEvent.CODE];
  }
  return [event_str, KeyEvent.CODE];
}

export function getEventStr(event_str, mode){
  mode ??= KeyEvent.AUTO;
  if(mode==KeyEvent.AUTO){
    return getAutoEventStr(event_str);
  }
  return [event_str, mode];
}
