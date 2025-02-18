import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import { type Filter } from '../types.js';

export class FiltersCallback<Model extends LucidModel> implements Filter<Model> {
  public constructor(
    private callback: (
      query: ModelQueryBuilderContract<Model>,
      value: StrictValuesWithoutRaw,
      property: string,
    ) => void,
  ) {}

  public handle(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    value: StrictValuesWithoutRaw,
    property: string,
  ): void {
    this.callback(query, value, property);
  }
}
