// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

// `ng build --coll-rp-01` o `npm run build -- --configuration=coll-rp-01` o `npm run package-coll`
// replaces `environment.ts` with `environment.coll-rp-01.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // ambiente di deploy (dev, test, coll, prod)
  ambiente: 'coll',
  envApplication: 'H',
  shibbolethAuthentication: true,

  production: true,

  publicPath: '',

  appBaseHref: '/pslboweb',

  beServerPrefix: '',
  beService: '/pslboweb/restfacade/be',

  shibbolethSSOLogoutURL: '',
  onAppExitURL: '',

  // correggere con baseurl di applicativo psplhome
  appHomeURL: '',
  appCittadinoURL: '',
  appFascicoloURL: '',
  urlMappe: "",
};
