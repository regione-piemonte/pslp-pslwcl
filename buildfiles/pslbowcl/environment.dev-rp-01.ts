// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

// `ng build --dev-rp-01` o `npm run build -- --configuration=dev-rp-01` o `npm run package-dev`
// replaces `environment.ts` with `environment.dev-rp-01.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // ambiente di deploy (dev, test, coll, prod)
  ambiente: 'dev',
  envApplication: 'H',
  shibbolethAuthentication: false,

  production: false,

  publicPath: '',

  appBaseHref: '/pslboweb',

  beServerPrefix: 'http://localhost:8080',
  beService: '/pslboweb/restfacade/be',

  shibbolethSSOLogoutURL: 'http://www.csi.it',
  onAppExitURL: 'http://www.csi.it',

  appHomeURL: '',
  appCittadinoURL: '',
  appFascicoloURL: '',
  urlMappe: "",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
