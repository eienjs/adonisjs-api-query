import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type Sort } from '../types.js';

export class SortsField<Model extends LucidModel> implements Sort<Model> {
  public handle(query: ModelQueryBuilderContract<Model>, descending: boolean, property: string): void {
    void query.orderBy(property, descending ? 'desc' : 'asc');
  }
}
