// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

// `ng build --local` o `npm run build -- --configuration=local` o `npm run package-local`
// replaces `environment.ts` with `environment.local.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // ambiente di deploy (dev, test, coll, prod)
  ambiente: 'dev',
  envApplication: 'F',
  shibbolethAuthentication: false,

  production: false,

  publicPath: 'http://localhost:8080/pslfcweb/',

  appBaseHref: '/pslfcweb',

  beServerPrefix: 'http://localhost:8080',
  beService: '/pslfcweb/restfacade/be',

  shibbolethSSOLogoutURL: 'http://www.csi.it',
  onAppExitURL: 'http://www.csi.it',

  appHomeURL: 'http://localhost:4200',
  appCittadinoURL: 'http://localhost:4201',
  appFascicoloURL: 'http://localhost:4202',
  urlMappe: "https://tst-secure.sistemapiemonte.it/pslpublicweb/mappa/mappa.html",
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
