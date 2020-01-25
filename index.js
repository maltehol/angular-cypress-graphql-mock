// read the config
const graphQLEndpoint = Cypress.config('graphQLEndpoint') ? Cypress.config('graphQLEndpoint') : '/graphql';
const graphQLMethod = Cypress.config('graphQLMethod') ? Cypress.config('graphQLMethod') : 'POST';
const LS_PREFIX = 'gqlmock_';

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
   for (const key of Object.keys(localStorage)) {
      if (key.startsWith(LS_PREFIX)) {
         localStorage.removeItem(key);
      }
   }
   });

Cypress.Commands.add('addGraphQLMockMap', (queryToMockFnMap) => {
   for (const query of Object.keys(queryToMockFnMap)) {
      localStorage.setItem(`${LS_PREFIX}${query}`, queryToMockFnMap[query].toString());
   }
   });

Cypress.Commands.add('addGraphQLMock', (query, mockFn) => {
   localStorage.setItem(`${LS_PREFIX}${query}`, mockFn.toString());
});

Cypress.Commands.add('removeGraphQLMock', (query) => {
   localStorage.removeItem(`${LS_PREFIX}${query}`);
});

Cypress.Commands.add('enableMocking', () => {
   cy.window().then((win) => {
      const open = win.XMLHttpRequest.prototype.open;
      win.open = open;

      win.XMLHttpRequest.prototype.open = function (method, url) {
         if (method !== graphQLMethod || !url.includes(graphQLEndpoint)) {
            win.open.call(this, method, url);
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
               `You may want to use this:\n\ncy.addGraphQLMock('${query}', (graphQLRequest) => (${response}));`);
         });

         let send = this.send;
         this.send = (x) => {
            try {
               const request = JSON.parse(x);
               const match = regexp.exec(request.query);
               const { query, parameter, body } = match.groups;
               this.graphQLQuery = query;

               const mockFn = localStorage.getItem(`${LS_PREFIX}${query}`);
               if (!mockFn) {
                  send.call(this, x);
                  return;
               }

               Object.defineProperty(this, 'response', { writable: true });
               Object.defineProperty(this, 'responseText', { writable: true });
               Object.defineProperty(this, 'status', { writable: true });
               Object.defineProperty(this, 'readyState', { writable: true });

               const graphQLRequest = {
                  ...request,
                  parsedQuery: { query, parameter, body }
               };

               this.response = this.responseText = JSON.stringify({
                  "data": eval('(' + mockFn + ')')(graphQLRequest),
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
   });
});


Cypress.Commands.add('disableMocking', () => {
   cy.window().then((win) => {
      if (win.open) {
         win.XMLHttpRequest.prototype.open = win.open;
      }
   });
});
