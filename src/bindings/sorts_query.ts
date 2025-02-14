import { type ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { type LucidModel } from '@adonisjs/lucid/types/model';
import { collect, type Collection } from 'collect.js';
import { AllowedSort } from '../allowed_sort.js';
import { InvalidSortQuery } from '../exceptions/invalid_sort_query.js';
import { type ResolvedApiQueryConfig } from '../types.js';

type ModelQueryBuilderWithAllowedSorts = ModelQueryBuilder & { _allowedSorts: Collection<AllowedSort<LucidModel>> };

export const extendModelQueryBuilderWithSortsQuery = function (
  builder: typeof ModelQueryBuilder,
  config: ResolvedApiQueryConfig,
): void {
  const ensureAllSortsExist = (self: ModelQueryBuilderWithAllowedSorts): void => {
    if (config.disableInvalidSortQueryException) {
      return;
    }

    const requestedSortNames = self
      .getRequest()
      .sorts()
      .map((sort) => sort.replace(/^-+/, ''));
    const allowedSortNames = self._allowedSorts.map((sort) => sort.getName());
    const unknownSort = requestedSortNames.diff(allowedSortNames);

    if (unknownSort.isNotEmpty()) {
      throw InvalidSortQuery.sortsNotAllowed(unknownSort.all(), allowedSortNames.all());
    }
  };

  const findSort = (self: ModelQueryBuilderWithAllowedSorts, property: string): AllowedSort<LucidModel> | undefined => {
    return self._allowedSorts.first((sort) => sort.isSort(property));
  };

  const addRequestedSortsToQuery = (self: ModelQueryBuilderWithAllowedSorts): void => {
    self
      .getRequest()
      .sorts()
      .each((property) => {
        const descending = property.startsWith('-');
        const key = property.replace(/^-+/, '');
        const sort = findSort(self, key);

        sort?.sort(self, descending);
      });
  };

  builder.macro('allowedSorts', function (this: ModelQueryBuilderWithAllowedSorts, ...sorts) {
    const arraySorts = Array.isArray(sorts.at(0)) ? sorts.at(0) : (sorts as (AllowedSort<LucidModel> | string)[]);

    this._allowedSorts = collect(arraySorts).map((sort) => {
      if (sort instanceof AllowedSort) {
        return sort;
      }

      return AllowedSort.field(sort.replace(/^-+/, ''));
    });

    ensureAllSortsExist(this);
    addRequestedSortsToQuery(this);

    return this;
  });

  builder.macro('defaultSort', function (this: ModelQueryBuilderWithAllowedSorts, ...sorts) {
    if (this.getRequest().sorts().isEmpty()) {
      // We've got requested sorts. No need to parse defaults.

      return this;
    }

    const arraySorts = Array.isArray(sorts.at(0)) ? sorts.at(0) : (sorts as (AllowedSort<LucidModel> | string)[]);

    collect(arraySorts)
      .map((sort) => {
        if (sort instanceof AllowedSort) {
          return sort;
        }

        return AllowedSort.field(sort);
      })
      .each((sort) => {
        sort.sort(this);
      });

    return this;
  });
};
