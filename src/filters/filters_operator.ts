import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import type { StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import type { EnumType, Filter } from '../types.js';
import { FilterOperator } from '../enums/filter_operator.js';
import { substrReplace } from '../utils/helpers.js';
import { FiltersExact } from './filters_exact.js';

export class FiltersOperator<Model extends LucidModel> extends FiltersExact<Model> implements Filter<Model> {
  public constructor(
    protected shouldAddRelationConstraint: boolean,
    protected filterOperator: EnumType<typeof FilterOperator>,
    protected boolean: 'and' | 'or',
  ) {
    super(shouldAddRelationConstraint);
  }

  public handle(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    value: StrictValuesWithoutRaw | null,
    property: string,
  ): void {
    let { filterOperator } = this;

    if (this.shouldAddRelationConstraint && this.isRelationProperty(query, property)) {
      this.withRelationConstraint(query, value, property);

      return;
    }

    if (Array.isArray(value)) {
      const items = value;

      void query.where((subQuery) => {
        for (const item of items) {
          this.handle(subQuery, item, property);
        }
      });

      return;
    }

    if (value === null) {
      void query.whereNull(this.qualifyColumn(query, property));

      return;
    }

    if (filterOperator === FilterOperator.Dynamic) {
      filterOperator = this.getDynamicFilterOperator(value.toString());
      value = this.removeDynamicFilterOperatorFromValue(value.toString(), filterOperator);
    }

    if (this.boolean === 'and') {
      void query.where(this.qualifyColumn(query, property), filterOperator, value);

      return;
    }

    void query.orWhere(this.qualifyColumn(query, property), filterOperator, value);
  }

  protected getDynamicFilterOperator(value: string): EnumType<typeof FilterOperator> {
    let filterOperator: EnumType<typeof FilterOperator> = FilterOperator.Equal;

    for (const filterOperatorCase of Object.values(FilterOperator)) {
      if (value.startsWith(filterOperatorCase) && filterOperatorCase !== FilterOperator.Dynamic) {
        filterOperator = filterOperatorCase;
      }
    }

    return filterOperator;
  }

  protected removeDynamicFilterOperatorFromValue(value: string, filterOperator: EnumType<typeof FilterOperator>): string {
    if (value.includes(filterOperator)) {
      value = substrReplace(value, '', 0, filterOperator.length);
    }

    return value;
  }
}
