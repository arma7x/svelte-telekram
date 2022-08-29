declare var navigator:any;
declare var String:any;

import '../../public/js/polyfill.min.js';

if (navigator.mozSetMessageHandler != null) {
  Object.defineProperty(XMLHttpRequest.prototype, "mozSystem", { value: true });
}

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(str, newStr) {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
      return this.replace(str, newStr);
    }
    // If a string
    return this.replace(new RegExp(str, 'g'), newStr);
  };
}

if (!String.prototype.padRight) {
  String.prototype.padRight = function(n, pad) {
    let t = this;
    if(n > this.length)
      for(let i = 0; i < n-this.length; i++)
        t += pad;
    return t;
  }
}
