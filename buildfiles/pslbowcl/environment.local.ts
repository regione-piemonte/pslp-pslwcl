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
  envApplication: 'H',
  shibbolethAuthentication: false,

  production: false,

  publicPath: 'http://localhost:8080/pslboweb/',

  appBaseHref: '/pslboweb',

  beServerPrefix: 'http://localhost:8080',
  beService: '/pslboweb/restfacade/be',

  shibbolethSSOLogoutURL: '',
  onAppExitURL: '',

  appHomeURL: 'http://localhost:4204',
};
