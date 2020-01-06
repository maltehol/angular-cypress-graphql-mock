# angular-cypress-graphql-mock

This package adds the possibility to mock [GraphQL](https://graphql.org/) request in cypress when using the [apollo-graphql-angular](https://www.apollographql.com/docs/) framework.

It intercepts the XHR send method to manipulate the XHR and simulates a fake response when the request url matches the GraphQL endpoint.

## Cypress Configuration

You can provide some configurations in the `cypress.json` file:

| key               | default                                                                   | description                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| graphQLEndpoint   | `'/graphql'`                                                              | The GraphQL Endpoint                                                                                                                                                                                                   |
| graphQLMethod     | `'POST'`                                                                  | The HTTP Method the GraphQL requests using                                                                                                                                                                             |
| graphQLParseRegEx | `/{\s*(?<query>[\w\-]+)(?:\((?<parameter>[^\)]+)\))?(?<body>(?:.*\s)*)}/` | This RegExp is used to parse the GraphQL query to get the query name, query parameters and body.                                                                                                                       |
| globalMocks       | `{}`                                                                      | If there are some Mocks that should work for all requests, this is the config value to set. It accepts a Dictionary with the query name as key and a function as value: `{ query: (parameter, body) => graphql Mock }` |

## How to use?

As long as there is no npm packet, you can install it by:
```bash
$ npm install https://github.com/maltehol/angular-cypress-graphql-mock.git
```
or
```bash
$ git clone https://github.com/maltehol/angular-cypress-graphql-mock.git
$ cd <your-project>
$ npm install <path-to-angular-cypress-graphql-mock-clone>
```

Import the package in your `command.js` file
```js
import 'angular-cypress-graphql-mock';
```

If needed you can add global mock data:
```js
let globalMocks = {};
globalMocks['User'] = (parameter, body) => ({
   "User": {
      "name": "John Doe",
      "__typename": "User"
   }
});
Cypress.config('globalMocks', globalMocks)
```
  
In your test files you can then use it: 
```js
describe('My Mocked Test', function () {
   it('loads a mocked Post', function () {
      cy.addGraphQLMock('Post', (a, b) => ({
         "Post": {
            "id": "35",
            "title": "Lorem Ipsum",
            "views": 254,
            "User": {
               "name": "John Doe",
               "__typename": "User"
            },
            "Comments": [
               {
                  "date": "2017-07-03T00:00:00.000Z",
                  "body": "Consectetur adipiscing elit",
                  "__typename": "Comment"
               },
               {
                  "date": "2017-08-17T00:00:00.000Z",
                  "body": "Nam molestie pellentesque dui",
                  "__typename": "Comment"
               }
            ],
            "__typename": "Post"
         }
      }));

      cy.visit('http://localhost:4200')
      cy.get('#title').contains('Lorem Ipsum')
   })
})
```

## Possibilities to set the Mock Data

| command                                  | parameter                                                                                          | description                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `cy.resetGraphQLMocks()`                 |                                                                                                    | resets the current Mocks to the global Mocks  |
| `cy.addGraphQLMockMap(queryToMockFnMap)` | `queryToMockFnMap`: like the `globalMocks`                                                         | adds all mocks given in the map to the Mocks. |
| `cy.addGraphQLMock(query, mockFn)`       | `query` Query Name this mock shall apply to <br> `mockFn` The mock function that shall be executed | Adds the Mock function to the Mocks.          |
| `cy.removeGraphQLMock(query)`            | `query` Name of the query                                                                          | removes the mock function for the query       |

## Limits

The package only works with `XHR` and only intercepts request that are fired when executing `cy.visit`.
Also every request that is intercepted will **not** appear in the Network tab of the developer console.