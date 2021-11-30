import { Injector } from '@angular/core';
import { LOCATION_INITIALIZED, DOCUMENT } from '@angular/common';
import { AppUserService } from '../app-user.service';

const XSRF_COOKIE = 'XSRF-TOKEN';

export function XsrfTokenAppInitializerFactory(
    appUserService: AppUserService,
    injector: Injector): () => Promise<any> {
  const document = injector.get(DOCUMENT);
  const cookies = getCookieMap(document);
  appUserService.xsrfToken = cookies[XSRF_COOKIE];

  return () => injector.get(LOCATION_INITIALIZED, Promise.resolve(null))
    .then(() => null);
}

function getCookieMap(document: Document): {[key: string]: string} {
  if (!document) {
    return {};
  }
  return (document.cookie || '').split(/\s*;\s*/)
    .reduce((acc, cookie) => {
      const cookieContent = cookie.split('=');
      acc[cookieContent[0]] = cookieContent.slice(1).join('=');
      return acc;
    }, {});

}
