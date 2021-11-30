import { InjectionToken } from '@angular/core';
import { VersionData } from '@pslwcl/pslmodel'; // NOSONAR evita falso positivo rule typescript:S4328

export const APP_VERSION = new InjectionToken<VersionData>('APP_VERSION');
