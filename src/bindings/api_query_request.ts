import { type Request } from '@adonisjs/core/http';
import { type ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { ApiQueryBuilderRequest } from '../api_query_builder_request.js';

type ModelQueryBuilderWithRequest = ModelQueryBuilder & { $queryBuilderRequest?: ApiQueryBuilderRequest };

export const extendModelQueryBuilderWithRequest = function (builder: typeof ModelQueryBuilder): void {
  builder.macro('setRequest', function (this: ModelQueryBuilderWithRequest, request: Request) {
    this.$queryBuilderRequest = ApiQueryBuilderRequest.fromRequest(request);

    return this;
  });

  builder.macro('getRequest', function (this: ModelQueryBuilderWithRequest) {
    if (!this.$queryBuilderRequest) {
      this.$queryBuilderRequest = new ApiQueryBuilderRequest();
    }

    return this.$queryBuilderRequest;
  });
};
