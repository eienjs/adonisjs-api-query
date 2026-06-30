import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import type { StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import type { Filter } from '../../../src/types.js';
import type TestModel from '../models/test_model.js';

export default class CustomFilter implements Filter<typeof TestModel> {
  public handle(
    query: ModelQueryBuilderContract<typeof TestModel, TestModel>,
    value: StrictValuesWithoutRaw | null,
    _property: string,
  ): void {
    if (value === null) {
      return;
    }

    void query.where('name', value);
  }
}
