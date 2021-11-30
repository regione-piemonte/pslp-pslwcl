// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

const HTTP_LOCALHOST_4204 = 'http://localhost:4204';
export const environment = {
  // ambiente di deploy (dev, test, coll, prod)
  ambiente: 'dev',
  envApplication: 'F',

  shibbolethAuthentication: false,

  production: false,

  publicPath: 'http://mydevpc.csi.it:17000/tstang2web/',

  appBaseHref: '/',

  beServerPrefix: `${location.protocol}//${location.hostname}:8080`,
  beService: '/pslweb/restfacade/be',

  shibbolethSSOLogoutURL: HTTP_LOCALHOST_4204,
  onAppExitURL: HTTP_LOCALHOST_4204,

  appHomeURL: HTTP_LOCALHOST_4204,
  appBackOfficeURL: HTTP_LOCALHOST_4204,
  appCittadinoURL: 'http://localhost:4201',
  appFascicoloURL: 'http://localhost:4202',
};
console.log(environment);

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
