# 0.3.0
* Migration to TypeScript
* prevent deletion of mocks between tests 

# 0.2.1
* Use local storage to store Mocks 
* Use Event `window:before:load` to overwrite send method on each new `cy.visit()`

# 0.2.0
 
**Breaking Changes**

* Mocks are not enabled by default. You have to call `cy.enableMocking()` to enable them.
* The Mocking function signature changed to 
  ```ts
  MockFn = (graphQLRequest?: GraphQLRequest) => string | object;
  ```   
  The previous parameters `parameters` and `body` are now part of the `parsedQuery` field of `GraphQLRequest`.

# 0.1.2
* first public version
