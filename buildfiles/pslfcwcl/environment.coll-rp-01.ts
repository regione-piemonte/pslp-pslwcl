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
  envApplication: 'F',
  shibbolethAuthentication: false,

  production: true,

  publicPath: 'https://coll-secure.sistemapiemonte.it/pslfcweb/',

  appBaseHref: '/pslfcweb',

  beServerPrefix: 'https://coll-secure.sistemapiemonte.it',
  beService: '/pslfcweb/restfacade/be',

  shibbolethSSOLogoutURL: 'https://coll-secure.sistemapiemonte.it/liv3/Shibboleth.sso/Logout',
  onAppExitURL: 'http://www.coll-www.sistemapiemonte.it',

  // correggere con baseurl di applicativo psplhome
  appHomeURL: 'https://coll-secure.sistemapiemonte.it/pslphome',
  appCittadinoURL: 'https://coll-secure.sistemapiemonte.it/pslweb',
  appFascicoloURL: 'https://coll-secure.sistemapiemonte.it/pslfcweb',
  urlMappe: "https://coll-secure.sistemapiemonte.it/pslpublicweb/mappa/mappa.html",
};
