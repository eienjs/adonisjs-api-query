import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import { type Filter } from '../types.js';

export class FiltersTrashed<Model extends LucidModel> implements Filter<Model> {
  public handle(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    value: StrictValuesWithoutRaw,
    _property: string,
  ): void {
    if (!('withTrashed' in query && 'onlyTrashed' in query)) {
      return;
    }

    const queryWithSoftDeletes = query as {
      withTrashed(): ModelQueryBuilderContract<Model>;
      onlyTrashed(): ModelQueryBuilderContract<Model>;
    };

    if (value === 'with') {
      void queryWithSoftDeletes.withTrashed();

      return;
    }

    if (value === 'only') {
      void queryWithSoftDeletes.onlyTrashed();
    }
  }
}
