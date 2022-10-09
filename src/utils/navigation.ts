function keydownEventHandler(evt, scope) {
  switch (evt.key) {
    case 'Backspace':
    case 'EndCall':
      scope.backspaceListener(evt);
      break;
    case 'SoftLeft':
    case 'PageUp':
    case 'Shift':
      scope.softkeyLeftListener(evt);
      evt.preventDefault();
      break;
    case 'SoftRight':
    case 'PageDown':
    case 'Control':
      scope.softkeyRightListener(evt);
      evt.preventDefault();
      break;
    case 'Enter':
      scope.enterListener(evt);
      break;
    case 'ArrowUp':
      scope.arrowUpListener(evt);
      break;
    case 'ArrowDown':
      scope.arrowDownListener(evt);
      break;
    case 'ArrowLeft':
      scope.arrowLeftListener(evt);
      break;
    case 'ArrowRight':
      scope.arrowRightListener(evt);
      break;
  }
}

function isElementInViewport(el, marginTop = 0, marginBottom = 0) {
  if (el.parentElement.getAttribute("data-pad-top"))
    marginTop = parseFloat(el.parentElement.getAttribute("data-pad-top"));
  if (el.parentElement.getAttribute("data-pad-bottom"))
    marginBottom = parseFloat(el.parentElement.getAttribute("data-pad-bottom"));
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 + marginTop &&
    rect.left >= 0 &&
    rect.bottom <= ((window.innerHeight || document.documentElement.clientHeight) - marginBottom) && /* or $(window).height() */
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) /* or $(window).width() */
  );
}

function dispatchScroll(target, newScrollTop) {
  target.scroll({ top: newScrollTop, behavior: 'smooth' });
}

function dispatchFocus(target, newScrollTop) {
  target.scrollTop = newScrollTop;
  const e = document.createEvent("UIEvents");
  e.initUIEvent("scroll", true, true, window, 1);
  target.dispatchEvent(e);
}

class KaiNavigator {
  private init: boolean = false;
  private eventHandler: any; // actual is EventListenerObject, any to suppress error
  target: string;
  verticalNavIndex: number = -1;
  verticalNavClass: string;
  horizontalNavIndex: number = -1;
  horizontalNavClass: string;
  arrowUpListener: Function = (evt) => {
    if (this.verticalNavClass) {
      evt.preventDefault();
      this.navigateListNav(-1);
    }
  };
  arrowDownListener: Function = (evt) => {
    if (this.verticalNavClass) {
      evt.preventDefault();
      this.navigateListNav(1);
    }
  };
  arrowLeftListener: Function = (evt) => {
    if (this.horizontalNavClass) {
      evt.preventDefault();
      this.navigateTabNav(-1);
    }
  };
  arrowRightListener: Function = (evt) => {
    if (this.horizontalNavClass) {
      evt.preventDefault();
      this.navigateTabNav(1);
    }
  };
  softkeyLeftListener: Function = (evt) => {};
  softkeyRightListener: Function = (evt) => {};
  enterListener: Function = (evt) => {};
  backspaceListener: Function = (evt) => {};

  constructor(opts = {}) {
    for(const x in opts) {
      if (typeof opts[x] === 'function')
        typeof opts[x];
      this[x] = opts[x];
    }
    this.eventHandler = (evt: any) => {
      keydownEventHandler(evt, this);
    }
  }

  navigateListNav(next) {
    return this.nav(next, 'verticalNavIndex', 'verticalNavClass');
  }

  navigateTabNav(next) {
    return this.nav(next, 'horizontalNavIndex', 'horizontalNavClass');
  }

  nav(next, navIndex, navClass) {
    const currentIndex = this[navIndex];
    const nav = document.getElementsByClassName(this[navClass]);
    if (nav.length === 0) {
      return;
    }
    var move = currentIndex + next;
    var cursor:any = nav[move];
    if (cursor != undefined) {
      cursor.focus();
      this[navIndex] = move;
    } else {
      if (move < 0) {
        move = nav.length - 1;
      } else if (move >= nav.length) {
        move = 0;
      }
      cursor = nav[move];
      cursor.focus();
      this[navIndex] = move;
    }
    cursor.classList.add('focus');
    if (currentIndex > -1 && nav.length > 1) {
      nav[currentIndex].classList.remove('focus');
    }
    if (!isElementInViewport(cursor)) {
      var marginTop = 0, marginBottom = 0;
      if (cursor.parentElement.getAttribute("data-pad-top"))
        marginTop = parseFloat(cursor.parentElement.getAttribute("data-pad-top"));
      if (cursor.parentElement.getAttribute("data-pad-bottom"))
        marginBottom = parseFloat(cursor.parentElement.getAttribute("data-pad-bottom"));
      let offsetTop = cursor.offsetTop - ((cursor.parentElement.clientHeight - marginTop - marginBottom) / 2);
      if ((cursor.clientHeight / cursor.parentElement.clientHeight) >= 0.7)
        offsetTop = cursor.offsetTop;
      dispatchScroll(cursor.parentElement, offsetTop);
      setTimeout(() => {
        if (!isElementInViewport(cursor)) {
          dispatchFocus(cursor.parentElement, offsetTop);
        }
      }, 150);
    }
    if (['INPUT', 'TEXTAREA'].indexOf(document.activeElement.tagName) > -1) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    const keys = Object.keys(cursor.children);
    for (var k in keys) {
      if (['INPUT', 'TEXTAREA'].indexOf(cursor.children[k].tagName) > -1) {
        setTimeout(() => {
          cursor.children[k].focus();
          cursor.children[k].selectionStart = cursor.children[k].selectionEnd = (cursor.children[k].value.length || cursor.children[k].value.length);
        }, 100);
        break;
      }
    }
  }

  attachListener(next:number = 1) {
    document.addEventListener('keydown', this.eventHandler);
    if (!this.init)
      this.init = true;
    else
      return;
    setTimeout(() => {
      if (this.verticalNavClass != null)
        this.navigateListNav(next);
      else if (this.horizontalNavClass != null)
        this.navigateTabNav(next);
    }, 100);
  }

  detachListener() {
    document.removeEventListener('keydown', this.eventHandler);
  }
}

const createKaiNavigator = (opts = {}) => {
  return new KaiNavigator(opts);
}

export {
  createKaiNavigator,
  KaiNavigator
}
