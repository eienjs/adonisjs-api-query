import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import type { Sort } from '../types.js';

export class SortsField<Model extends LucidModel> implements Sort<Model> {
  public handle(query: ModelQueryBuilderContract<Model>, isDescending: boolean, property: string): void {
    void query.orderBy(property, isDescending ? 'desc' : 'asc');
  }
}
