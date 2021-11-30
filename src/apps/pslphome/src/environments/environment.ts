// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // ambiente di deploy (dev, test, coll, prod)
  ambiente: 'dev',
  envApplication: 'H',
  shibbolethAuthentication: false,

  production: false,

  publicPath: 'http://mydevpc.csi.it:17000/tstang2web/',

  appBaseHref: '/',

  beServerPrefix: `${location.protocol}//${location.hostname}:8080`,
  beService: '/pslweb/restfacade/be',

  shibbolethSSOLogoutURL: '/',
  onAppExitURL: '/',

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
