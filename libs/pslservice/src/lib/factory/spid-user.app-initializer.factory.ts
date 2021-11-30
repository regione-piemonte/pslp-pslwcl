import { LOCATION_INITIALIZED } from '@angular/common';
import { Injector } from '@angular/core';
import { SpidUserService } from '@pslwcl/pslservice'; // NOSONAR evita falso positivo rule typescript:S4328

export function SpidUserAppInitializerFactory(
    spidUserService: SpidUserService,
    injector: Injector): () => Promise<any> {
  spidUserService.hydrateData();
  return () => injector.get(LOCATION_INITIALIZED, Promise.resolve(null))
    .then(() => null);
}
