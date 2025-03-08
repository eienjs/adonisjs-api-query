import { type Request } from '@adonisjs/core/http';
import { type ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { ApiQueryBuilderRequest } from '../api_query_builder_request.js';

type ModelQueryBuilderWithRequest = ModelQueryBuilder & { $queryBuilderRequest?: ApiQueryBuilderRequest };

export const extendModelQueryBuilderWithRequest = function (builder: typeof ModelQueryBuilder): void {
  builder.macro('withRequest', function (this: ModelQueryBuilderWithRequest, request: Request) {
    this.$queryBuilderRequest = ApiQueryBuilderRequest.fromRequest(request);

    return this;
  });

  builder.getter('$apiQueryBuilderRequest', function (this: ModelQueryBuilderWithRequest) {
    return this.$queryBuilderRequest ?? new ApiQueryBuilderRequest();
  });
};
