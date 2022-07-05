import { sprintf } from 'sprintf-js';

interface Translation {
  [key: string]: string;
}

interface Locale {
  [locale: string]: Translation;
}

class Localization {

  locales: Locale = {};
  namespace: string;
  defaultLocale: string;

  constructor(locale: string, namespace: string) {
    this.defaultLocale = locale;
    this.namespace = namespace;
    this.loadLocale(this.defaultLocale);
  }

  loadLocale(locale: string, cache: boolean = true, origin: string = document.location.origin): boolean {
    if (cache && this.locales[locale] != null) {
      this.defaultLocale = locale;
      return true;
    } else {
      const url = [];
      url.push(origin);
      if (this.namespace !== '' && origin === document.location.origin)
        url.push(this.namespace);
      url.push(`${locale}.json`);
      const request = new XMLHttpRequest();
      request.open('GET', url.join('/'), false);
      request.send(null);
      if (request.readyState === 4 && request.status >= 200 && request.status <= 399) {
        this.defaultLocale = locale;
        this.locales[this.defaultLocale] = JSON.parse(request.responseText);
        return true;
      } else if (request.readyState === 4) {
        return false;
      }
    }
  }

  lang(key: string, ...args: any): string | boolean {
    const line = this.locales[this.defaultLocale][key];
    if (line == null)
      return false;
    return sprintf(line, ...args);
  }

  langByLocale(key: string, locale: string, ...args: any): string | boolean {
    if (this.locales[locale] == null)
      return false;
    const line = this.locales[locale][key];
    if (line == null)
      return false;
    return sprintf(line, ...args);
  }

  getLocaleTranslation(locale: string): Translation {
    return this.locales[locale];
  }

}

export {
  Localization
}
