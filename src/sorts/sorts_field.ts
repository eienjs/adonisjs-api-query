import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type Sort } from '../types.js';

export class SortsField implements Sort {
  public handle<Model extends LucidModel, Result = InstanceType<Model>>(
    query: ModelQueryBuilderContract<Model, Result>,
    descending: boolean,
    property: string,
  ): void {
    void query.orderBy(property, descending ? 'desc' : 'asc');
  }
}
