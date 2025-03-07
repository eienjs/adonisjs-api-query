import { configProvider } from '@adonisjs/core';
import { RuntimeException } from '@adonisjs/core/exceptions';
import { type Request } from '@adonisjs/core/http';
import { type ApplicationService } from '@adonisjs/core/types';
import { ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { type LucidModel } from '@adonisjs/lucid/types/model';
import { type ExtractModelRelations } from '@adonisjs/lucid/types/relations';
import { type Collection } from 'collect.js';
import { type AllowedFilter } from '../src/allowed_filter.js';
import { type AllowedInclude } from '../src/allowed_include.js';
import { type AllowedSort } from '../src/allowed_sort.js';
import { type ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import {
  type ApiQueryConfig,
  type ExtractKeys,
  type HintedString,
  type ResolvedApiQueryConfig,
  type SortUnionKeyParams,
} from '../src/types.js';

export default class ApiQueryProvider {
  public constructor(protected app: ApplicationService) {}

  public async boot(): Promise<void> {
    const { extendModelQueryBuilderWithRequest } = await import('../src/bindings/api_query_request.js');
    const { extendModelQueryBuilderWithSortsQuery } = await import('../src/bindings/sorts_query.js');
    const { extendModelQueryBuilderWithFiltersQuery } = await import('../src/bindings/filters_query.js');
    const { extendModelQueryBuilderWithIncludesQuery } = await import('../src/bindings/includes_query.js');
    const apiQueryConfigProvider = this.app.config.get<ApiQueryConfig>('apiquery');
    const config = await configProvider.resolve<ResolvedApiQueryConfig>(this.app, apiQueryConfigProvider);

    if (!config) {
      throw new RuntimeException(
        'Invalid "config/apiquery.ts" file. Make sure you are using the "defineConfig" method',
      );
    }

    extendModelQueryBuilderWithRequest(ModelQueryBuilder);
    extendModelQueryBuilderWithSortsQuery(ModelQueryBuilder, config);
    extendModelQueryBuilderWithFiltersQuery(ModelQueryBuilder, config);
    extendModelQueryBuilderWithIncludesQuery(ModelQueryBuilder, config);
  }
}

declare module '@adonisjs/lucid/orm' {
  interface ModelQueryBuilder {
    setRequest(request: Request): this;
    getRequest(): ApiQueryBuilderRequest;

    allowedSorts(...sorts: (AllowedSort<LucidModel> | string)[]): this;
    allowedSorts(sorts: (AllowedSort<LucidModel> | string)[]): this;
    defaultSort(...sorts: (AllowedSort<LucidModel> | string)[]): this;
    defaultSort(sorts: (AllowedSort<LucidModel> | string)[]): this;

    allowedFilters(...filters: (AllowedFilter<LucidModel> | string)[]): this;
    allowedFilters(filters: (AllowedFilter<LucidModel> | string)[]): this;

    allowedIncludes(...includes: (Collection<AllowedInclude<LucidModel>> | string)[]): this;
    allowedIncludes(includes: (Collection<AllowedInclude<LucidModel>> | string)[]): this;
  }
}

declare module '@adonisjs/lucid/types/model' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>> {
    setRequest(request: Request): this;
    getRequest(): ApiQueryBuilderRequest;

    allowedSorts(...sorts: (AllowedSort<Model> | HintedString<SortUnionKeyParams<Model>>)[]): this;
    allowedSorts(sorts: (AllowedSort<Model> | HintedString<SortUnionKeyParams<Model>>)[]): this;
    defaultSort(...sorts: (AllowedSort<Model> | HintedString<SortUnionKeyParams<Model>>)[]): this;
    defaultSort(sorts: (AllowedSort<Model> | HintedString<SortUnionKeyParams<Model>>)[]): this;

    allowedFilters(...filters: (AllowedFilter<Model> | ExtractKeys<ModelAttributes<InstanceType<Model>>>)[]): this;
    allowedFilters(filters: (AllowedFilter<Model> | ExtractKeys<ModelAttributes<InstanceType<Model>>>)[]): this;

    allowedIncludes(
      ...includes: (Collection<AllowedInclude<Model>> | HintedString<ExtractModelRelations<InstanceType<Model>>>)[]
    ): this;
    allowedIncludes(
      includes: (Collection<AllowedInclude<Model>> | HintedString<ExtractModelRelations<InstanceType<Model>>>)[],
    ): this;
  }
}
