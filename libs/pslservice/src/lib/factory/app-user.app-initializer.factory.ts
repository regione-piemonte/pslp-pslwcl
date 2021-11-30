import { Injector } from '@angular/core';
import { LOCATION_INITIALIZED } from '@angular/common';
import { AppUserService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

export function AppUserAppInitializerFactory(
    appUserService: AppUserService,
    injector: Injector): () => Promise<any> {
  appUserService.hydrateData();
  return () => injector.get(LOCATION_INITIALIZED, Promise.resolve(null))
    .then(() => null);
}
