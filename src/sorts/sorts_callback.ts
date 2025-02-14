import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type Sort } from '../types.js';

export class SortsCallback<Model extends LucidModel> implements Sort<Model> {
  public constructor(
    private readonly _callback: (
      query: ModelQueryBuilderContract<Model>,
      descending: boolean,
      property: string,
    ) => void,
  ) {}

  public handle(query: ModelQueryBuilderContract<Model>, descending: boolean, property: string): void {
    this._callback(query, descending, property);
  }
}
