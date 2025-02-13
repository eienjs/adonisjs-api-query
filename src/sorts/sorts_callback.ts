import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type Sort } from '../types.js';

export class SortsCallback implements Sort {
  public constructor(
    private readonly _callback: <Model extends LucidModel, Result = InstanceType<Model>>(
      query: ModelQueryBuilderContract<Model, Result>,
      descending: boolean,
      property: string,
    ) => void,
  ) {}

  public handle<Model extends LucidModel, Result = InstanceType<Model>>(
    query: ModelQueryBuilderContract<Model, Result>,
    descending: boolean,
    property: string,
  ): void {
    this._callback(query, descending, property);
  }
}
