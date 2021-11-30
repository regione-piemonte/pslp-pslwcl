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
  envApplication: 'F',

  /** Se si vuole simulare il comportamento dell'autenticazione come in prod
   *  e quindi senza pagina di login (inserimento codice fiscale) bisogna mettere il parametro
   *  shibbolethAuthentication: true
   */
  shibbolethAuthentication: false,

  production: false,

  publicPath: 'https://tst-secure.sistemapiemonte.it/pslfcweb/',

  appBaseHref: '/pslfcweb',

  beServerPrefix: 'https://tst-secure.sistemapiemonte.it',
  beService: '/pslfcweb/restfacade/be',

  shibbolethSSOLogoutURL: 'https://tst-secure.sistemapiemonte.it/liv3/Shibboleth.sso/Logout',
  onAppExitURL: 'https://tst-secure.sistemapiemonte.it/pslfcweb/',

  // correggere con baseurl di applicativo psplhome
  appHomeURL: 'https://tst-secure.sistemapiemonte.it/pslphome',
  appCittadinoURL: 'https://tst-secure.sistemapiemonte.it/pslweb',
  appFascicoloURL: 'https://tst-secure.sistemapiemonte.it/pslfcweb',
  urlMappe: "https://tst-secure.sistemapiemonte.it/pslpublicweb/mappa/mappa.html",
};
