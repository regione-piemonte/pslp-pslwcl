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

  publicPath: 'https://secure.sistemapiemonte.it/pslphome/',

  appBaseHref: '/pslphome',

  beServerPrefix: 'https://secure.sistemapiemonte.it',
  beService: '/pslphome/restfacade/be',

  shibbolethSSOLogoutURL: 'https://secure.sistemapiemonte.it/liv3/Shibboleth.sso/Logout',
  onAppExitURL: 'http://www.sistemapiemonte.it/cms/privati/lavoro#servizi-ai-cittadini',

   // correggere con baseurl di applicativo psplhome
  appHomeURL: 'https://secure.sistemapiemonte.it/pslphome',
  appCittadinoURL: 'https://secure.sistemapiemonte.it/pslweb',
  appFascicoloURL: 'https://secure.sistemapiemonte.it/pslfcweb',
  urlMappe: "https://secure.sistemapiemonte.it/pslpublicweb/mappa/mappa.html",
};
