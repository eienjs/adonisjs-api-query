import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import type { Sort } from '../types.js';

export class SortsCallback<Model extends LucidModel> implements Sort<Model> {
  public constructor(
    private readonly _callback: (
      query: ModelQueryBuilderContract<Model>,
      isDescending: boolean,
      property: string,
    ) => void,
  ) {}

  public handle(query: ModelQueryBuilderContract<Model>, isDescending: boolean, property: string): void {
    this._callback(query, isDescending, property);
  }
}
