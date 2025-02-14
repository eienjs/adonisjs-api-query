import { type ApplicationService } from '@adonisjs/core/types';
import { type Collection } from 'collect.js';
import { type AllowedSort } from '../src/allowed_sort.js';
import { type ExtractKeys } from '../src/types.js';

export default class ApiQueryProvider {
  public constructor(protected app: ApplicationService) {}

  public async boot(): Promise<void> {
    await import('../src/bindings/sorts_query.js');
  }
}

declare module '@adonisjs/lucid/orm' {
  interface ModelQueryBuilder {
    _allowedSorts: Collection<AllowedSort>;

    allowedSorts(...sorts: (AllowedSort | string)[]): this;
    allowedSorts(sorts: (AllowedSort | string)[]): this;
  }
}

declare module '@adonisjs/lucid/types/model' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ModelQueryBuilderContract<Model extends LucidModel, Result = InstanceType<Model>> {
    _allowedSorts: Collection<AllowedSort>;

    allowedSorts(...sorts: ExtractKeys<ModelAttributes<InstanceType<Model>>>[]): this;
    allowedSorts(sorts: ExtractKeys<ModelAttributes<InstanceType<Model>>>[]): this;
  }
}
