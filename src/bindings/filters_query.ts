/* eslint-disable unicorn/no-array-method-this-argument, unicorn/no-array-callback-reference */
import { type ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { type LucidModel } from '@adonisjs/lucid/types/model';
import collect, { type Collection } from 'collect.js';
import { AllowedFilter } from '../allowed_filter.js';
import { InvalidFilterQuery } from '../exceptions/invalid_filter_query.js';
import { type ResolvedApiQueryConfig } from '../types.js';

type ModelQueryBuilderWithAllowedFilters = ModelQueryBuilder & {
  _allowedFilters: Collection<AllowedFilter<LucidModel>>;
};

export const extendModelQueryBuilderWithFiltersQuery = function (
  builder: typeof ModelQueryBuilder,
  config: ResolvedApiQueryConfig,
): void {
  const ensureAllFiltersExist = (self: ModelQueryBuilderWithAllowedFilters): void => {
    if (config.disableInvalidFilterQueryException) {
      return;
    }

    const filterNames = self.getRequest().filters().keys();
    const allowedFilterNames = self._allowedFilters.map((allowedFilter) => {
      return allowedFilter.getName();
    });

    const diff = filterNames.diff(allowedFilterNames);

    if (diff.isNotEmpty()) {
      throw InvalidFilterQuery.filtersNotAllowed(diff.all(), allowedFilterNames.all());
    }
  };

  const isFilterRequested = (
    self: ModelQueryBuilderWithAllowedFilters,
    allowedFilter: AllowedFilter<LucidModel>,
  ): boolean => {
    return self.getRequest().filters().has(allowedFilter.getName());
  };

  const addRequestedFiltersToQuery = (query: ModelQueryBuilderWithAllowedFilters): void => {
    query._allowedFilters.each((allowedFilter) => {
      if (isFilterRequested(query, allowedFilter)) {
        const value = query.getRequest().filters().get(allowedFilter.getName());
        allowedFilter.filter(query, value);

        return;
      }

      if (allowedFilter.hasDefault()) {
        allowedFilter.filter(query, allowedFilter.getDefault());
      }
    });
  };

  builder.macro('allowedFilters', function (this: ModelQueryBuilderWithAllowedFilters, ...filters) {
    const arrayFilters = Array.isArray(filters.at(0))
      ? filters.at(0)
      : (filters as (AllowedFilter<LucidModel> | string)[]);
    this._allowedFilters = collect(arrayFilters).map((filter) => {
      if (filter instanceof AllowedFilter) {
        return filter;
      }

      return AllowedFilter.partial(filter);
    });

    ensureAllFiltersExist(this);
    addRequestedFiltersToQuery(this);

    return this;
  });
};
