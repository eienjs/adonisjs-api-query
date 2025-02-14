import { type Request } from '@adonisjs/core/http';
import { type ApplicationService } from '@adonisjs/core/types';
import { ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { type LucidModel } from '@adonisjs/lucid/types/model';
import { type AllowedSort } from '../src/allowed_sort.js';
import { type ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { type ExtractKeys, type ExtractKeysWithSort, type ResolvedApiQueryConfig } from '../src/types.js';

export default class ApiQueryProvider {
  public constructor(protected app: ApplicationService) {}

  public async boot(): Promise<void> {
    const { extendModelQueryBuilderWithRequest } = await import('../src/bindings/api_query_request.js');
    const { extendModelQueryBuilderWithSortsQuery } = await import('../src/bindings/sorts_query.js');
    extendModelQueryBuilderWithRequest(ModelQueryBuilder);
    extendModelQueryBuilderWithSortsQuery(ModelQueryBuilder, this.app.config.get<ResolvedApiQueryConfig>('apiquery'));
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
  }
}

declare module '@adonisjs/lucid/types/model' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>> {
    setRequest(request: Request): this;
    getRequest(): ApiQueryBuilderRequest;

    allowedSorts(...sorts: (ExtractKeys<ModelAttributes<InstanceType<Model>>> | AllowedSort<Model>)[]): this;
    allowedSorts(sorts: (ExtractKeys<ModelAttributes<InstanceType<Model>>> | AllowedSort<Model>)[]): this;
    defaultSort(
      ...sorts: (
        | AllowedSort<LucidModel>
        | ExtractKeys<ModelAttributes<InstanceType<Model>>>
        | ExtractKeysWithSort<ModelAttributes<InstanceType<Model>>>
      )[]
    ): this;
    defaultSort(
      sorts: (
        | AllowedSort<LucidModel>
        | ExtractKeys<ModelAttributes<InstanceType<Model>>>
        | ExtractKeysWithSort<ModelAttributes<InstanceType<Model>>>
      )[],
    ): this;
  }
}
