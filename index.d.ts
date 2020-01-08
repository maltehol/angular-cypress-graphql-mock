declare namespace Cypress {
   type MockFn = (parameter: string, body: string) => string | object;
   interface ConfigOptions {
      graphQLEndpoint: string,
      graphQLMethod: string,
      graphQLParseRegEx: string,
   }
   interface Chainable {
      resetGraphQLMocks(): void
      addGraphQLMockMap(queryToMockFnMap: { [query: string]: MockFn }): void
      addGraphQLMock(query: string, mockFn: MockFn): void
      removeGraphQLMock(query: string): void
   }
}

