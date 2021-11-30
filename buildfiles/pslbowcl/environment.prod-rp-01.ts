// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

// `ng build --prod-rp-01` o `npm run build -- --configuration=prod-rp-01` o `npm run package-prod`
// replaces `environment.ts` with `environment.prod-rp-01.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // ambiente di deploy (dev, test, coll, prod)
  ambiente: 'prod',
  envApplication: 'H',
  shibbolethAuthentication: true,

  production: true,

  publicPath: 'https://<sito>/pslboweb/',

  appBaseHref: '/pslboweb',

  beServerPrefix: 'https://<sito>',
  beService: '/pslboweb/restfacade/be',

  shibbolethSSOLogoutURL: 'https://<sito>/liv3/Shibboleth.sso/Logout',
  onAppExitURL: 'http://<sito>/cms/privati/lavoro#servizi-ai-cittadini',

   // correggere con baseurl di applicativo psplhome
  appHomeURL: 'https://<sito>/pslboweb',
  appCittadinoURL: 'https://<sito>/pslweb',
  appFascicoloURL: 'https://<sito>/pslfcweb',
  urlMappe: "https://<sito>/pslpublicweb/mappa/mappa.html",
};
