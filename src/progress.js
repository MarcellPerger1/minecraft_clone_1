// note: NOT a module

class Progress {
  constructor(max, value=null){
    window.progress = this;
    
    /** @type {HTMLProgressElement} */
    this.pbar = document.getElementById('load-progress');
    this.ptext = document.getElementById('progress-amount');

    this.pbar.max ??= max;
    if(value!=null){
      this.update(value);
    }
  }

  update(value){
    if(value==null||isNaN(value)){
      this.pbar.removeAttribute('value');
      this.ptext.innerText = "??%";
    } else {
      this.pbar.value = value;
      this.ptext.innerText = this.getPercent().toFixed() + '%';
    }
  }

  setFraction(value){
    this.update(this.pbar.max*value);
  }

  setPercent(value){
    this.setFraction(value/100);
  }

  getValue(){
    return this.pbar.hasAttribute('value') 
      ? this.pbar.value 
      : NaN;
  }

  getFraction(){
    return this.getValue() / this.pbar.max;
  }

  getPercent(){
    return this.getFraction()*100
  }

  add(n){
    this.update(this.getValue()+n);
  }

  addFraction(n){
    this.setFraction(this.getFraction()+n);
  }

  addPercent(n){
    this.setPercent(this.getPercent()+n);
  }
}

if(!window.progress) {
  /** @type {Progress} */
  var progress = window.progress = new Progress();  // global
  progress.addPercent(10);
}
