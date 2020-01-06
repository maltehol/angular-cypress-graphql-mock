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

// This is the "database" of mocked responses. The mocks are a function which gets 
// the query parameter and the query body as input
/*
   {
      Post: (parameter, body) => graphql result,
      User: (parameter, body) => graphql result
   }
*/
const globalMocks = Cypress.config('globalMocks') ? Cypress.config('globalMocks') : {};
let queryToMock = globalMocks;


Cypress.Commands.add('resetGraphQLMocks', () => {
   queryToMock = globalMocks;
});

Cypress.Commands.add('addGraphQLMockMap', (queryToMockFnMap) => {
   queryToMock = { ...queryToMock, ...queryToMockFnMap };
});

Cypress.Commands.add('addGraphQLMock', (query, mockFn) => {
   queryToMock[query] = mockFn;
});

Cypress.Commands.add('removeGraphQLMock', (query) => {
   queryToMock[query] = undefined;
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
            if (method !== graphQLMethod && url !== graphQLMethod) {
               open.call(this, method, url);
               return;
            }

            this.mocked = false;
            this.addEventListener('loadend', (event) => {
               if (this.mocked) {
                  return;
               }
               const query = event.target.graphQLQuery;
               let response = event.target.response;
               const jResponse = JSON.parse(response);
               if (jResponse.data) {
                  response = JSON.stringify(jResponse.data);
               }
               console.warn(`Query not mocked.`, `You may want to use this:\n\ncy.addGraphQLMock('${query}', (parameter, body) => (${response}));`);
               console.warn(event);
            });

            let send = this.send;
            this.send = (x) => {
               const match = regexp.exec(JSON.parse(x).query);
               const { query, parameter, body } = match.groups;
               this.graphQLQuery = query;

               if (!queryToMock[query]) {
                  send.call(this, x);
                  return;
               }

               Object.defineProperty(this, 'response', { writable: true });
               Object.defineProperty(this, 'responseText', { writable: true });
               Object.defineProperty(this, 'status', { writable: true });
               Object.defineProperty(this, 'readyState', { writable: true });

               this.response = this.responseText = JSON.stringify({
                  "data": queryToMock[query](parameter, body),
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
            };
            open.call(this, method, url);
         };
      }
   });
});
