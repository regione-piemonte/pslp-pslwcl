// #####################################################
// # Copyright Regione Piemonte - 2021                 #
// # SPDX-License-Identifier: EUPL-1.2-or-later        #
// #####################################################

// `ng build --tst-rp-01` o `npm run build -- --configuration=tst-rp-01` o `npm run package-test`
// replaces `environment.ts` with `environment.tst-rp-01.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // ambiente di deploy (dev, test, coll, prod)
  ambiente: 'test',
  envApplication: 'H',

    /** Se si vuole simulare il comportamento dell'autenticazione come in prod
   *  e quindi senza pagina di login (inserimento codice fiscale) bisogna mettere il parametro
   *  shibbolethAuthentication: true
   */
  shibbolethAuthentication: true,

  production: false,

  publicPath: 'https://<tst-sito>/pslboweb/',

  appBaseHref: '/pslboweb',

  beServerPrefix: 'https://<tst-sito>',
  beService: '/pslboweb/restfacade/be',

  shibbolethSSOLogoutURL: 'https://<tst-sito>/liv3/Shibboleth.sso/Logout',
  onAppExitURL: 'https://<tst-sito>/pslboweb/',

  // correggere con baseurl di applicativo psplhome
  appHomeURL: 'https://<tst-sito>/pslboweb',
  appCittadinoURL: 'https://<tst-sito>/pslweb',
  appFascicoloURL: 'https://<tst-sito>/pslfcweb',
  urlMappe: "https://<tst-sito>/pslpublicweb/mappa/mappa.html",
};
