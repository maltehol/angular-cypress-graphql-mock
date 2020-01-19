declare namespace Cypress {
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

declare type ParsedQuery = { query: string, parameter: string, body: string };
declare type GraphQLRequest<T> = {
   operationName: string,
   variables: T,
   query: string,
   parsedQuery: ParsedQuery
};
declare type MockFn = (graphQLRequest?: GraphQLRequest) => string | object;
