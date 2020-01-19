// read the config
const graphQLEndpoint = Cypress.config('graphQLEndpoint') ? Cypress.config('graphQLEndpoint') : '/graphql';
const graphQLMethod = Cypress.config('graphQLMethod') ? Cypress.config('graphQLMethod') : 'POST';

// extract the query, parameter and body of the graphql request. The query has the following form:
/*
   {
      query(parameter) {
         body
      }
   }
*/
const graphQLParseRegEx = Cypress.config('graphQLParseRegEx') ? Cypress.config('graphQLParseRegEx') : /{\s*(?<query>[\w\-]+)(?:\((?<parameter>[^\)]+)\))?(?<body>(?:.*\s)*)}/;
const regexp = new RegExp(graphQLParseRegEx);

Cypress.Commands.add('resetGraphQLMocks', () => {
   cy.window().then(window => {
      window.queryToMock = {};
   });
});

Cypress.Commands.add('addGraphQLMockMap', (queryToMockFnMap) => {
   cy.window().then(window => {
      window.queryToMock = { ...window.queryToMock, ...queryToMockFnMap };
   });
});

Cypress.Commands.add('addGraphQLMock', (query, mockFn) => {
   cy.window().then((window) => {
      if (!window.queryToMock) {
         window.queryToMock = {};
      }
      window.queryToMock[query] = mockFn;
   });
});

Cypress.Commands.add('removeGraphQLMock', (query) => {
   cy.window().then((window) => {
      if (!window.queryToMock) {
         window.queryToMock = {};
      }
      window.queryToMock[query] = undefined;
   });
});

Cypress.Commands.overwrite("visit", (originalFn, url, options) => {
   return originalFn(url, {
      ...options,
      onBeforeLoad: (win) => {
         // if given, execute the orginal onBeforeLoad function first
         if (options && options.onBeforeLoad) {
            options.onBeforeLoad.apply(win);
         }
         const open = win.XMLHttpRequest.prototype.open;
         win.XMLHttpRequest.prototype.open = function (method, url) {
            if (method !== graphQLMethod || !url.includes(graphQLEndpoint)) {
               open.call(this, method, url);
               return;
            }

            this.mocked = false;
            this.addEventListener('readystatechange', (event) => {
               if (event.target.readyState !== 4) {
                  return;
               }
               if (this.mocked) {
                  return;
               }


               const query = event.target.graphQLQuery;
               let response = event.target.response;

               try {
                  const jResponse = JSON.parse(response);
                  if (jResponse.data) {
                     response = JSON.stringify(jResponse.data);
                  }
               } catch (e) {
                  response = '<mocked Data>';
               }
               console.warn(`Query not mocked.`,
                  `You may want to use this:\n\ncy.addGraphQLMock('${query}', (parameter, body) => (${response}));`);
            });

            let send = this.send;
            this.send = (x) => {
               try {
                  const match = regexp.exec(JSON.parse(x).query);
                  const { query, parameter, body } = match.groups;
                  this.graphQLQuery = query;
                  if (!win.queryToMock || !win.queryToMock[query]) {
                     send.call(this, x);
                     return;
                  }

                  Object.defineProperty(this, 'response', { writable: true });
                  Object.defineProperty(this, 'responseText', { writable: true });
                  Object.defineProperty(this, 'status', { writable: true });
                  Object.defineProperty(this, 'readyState', { writable: true });

                  this.response = this.responseText = JSON.stringify({
                     "data": win.queryToMock[query](parameter, body),
                     "loading": false,
                     "networkStatus": 7,
                     "stale": false
                  });
                  this.status = 200;
                  this.readyState = 4;
                  this.mocked = true;

                  this.dispatchEvent(new CustomEvent('loadstart'));
                  this.dispatchEvent(new CustomEvent('progress'));
                  this.dispatchEvent(new CustomEvent('load'));
                  this.dispatchEvent(new CustomEvent('loadend'));
               } catch (e) {
                  console.info('Could not parse graphQL request. We ask the Server instead.');
                  send.call(this, x);
               }
            };
            open.call(this, method, url);
         };
      }
   });
});
