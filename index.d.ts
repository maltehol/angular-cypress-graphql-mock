declare namespace Cypress {
   type MockFn = (parameter: string, body: string) => string | object;
   interface ConfigOptions {
      graphQLEndpoint: string,
      graphQLMethod: string,
      graphQLParseRegEx: string,
      globalMocks: Dictionary<MockFn>
   }
   interface Chainable {
      resetGraphQLMocks(): void
      addGraphQLMockMap(queryToMockFnMap: Dictionary<MockFn>): void
      addGraphQLMock(query: string, mockFn: MockFn): void
      removeGraphQLMock(query: string): void
   }
}

