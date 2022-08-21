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
