import { type ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { collect } from 'collect.js';
import { AllowedSort } from '../allowed_sort.js';
import { type ResolvedApiQueryConfig } from '../types.js';

export const extendModelQueryBuilderWithSortsQuery = function (
  builder: typeof ModelQueryBuilder,
  config: ResolvedApiQueryConfig,
): void {
  builder.macro('allowedSorts', function (this: ModelQueryBuilder, ...sorts) {
    const arraySorts = Array.isArray(sorts.at(0)) ? sorts.at(0) : sorts as (AllowedSort | string)[];

    this._allowedSorts = collect(arraySorts).map((sort) => {
      if (sort instanceof AllowedSort) {
        return sort;
      }

      return AllowedSort.field(sort.replace(/^-+/, ''));
    });

    this._ensureAllSortsExist();

    this._addRequestedSortsToQuery();

    return this;
  });
};
