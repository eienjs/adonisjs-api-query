import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import { FilterOperator } from '../enums/filter_operator.js';
import { type Filter } from '../types.js';
import { substrReplace } from '../utils/helpers.js';
import { FiltersExact } from './filters_exact.js';

export class FiltersOperator<Model extends LucidModel> extends FiltersExact<Model> implements Filter<Model> {
  public constructor(
    protected $addRelationConstraint: boolean,
    protected $filterOperator: FilterOperator,
  ) {
    super($addRelationConstraint);
  }

  public handle(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    value: StrictValuesWithoutRaw,
    property: string,
  ): void {
    let filterOperator = this.$filterOperator;

    if (this.$addRelationConstraint && this.isRelationProperty(query, property)) {
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

    if (filterOperator === FilterOperator.Dynamic) {
      filterOperator = this.getDynamicFilterOperator(value.toString());
      value = this.removeDynamicFilterOperatorFromValue(value.toString(), filterOperator);
    }

    void query.where(this.qualifyColumn(query, property), filterOperator, value);
  }

  protected getDynamicFilterOperator(value: string): FilterOperator {
    let filterOperator: FilterOperator = FilterOperator.Equal;

    for (const filterOperatorCase of Object.values(FilterOperator)) {
      if (value.startsWith(filterOperatorCase) && filterOperatorCase !== FilterOperator.Dynamic) {
        filterOperator = filterOperatorCase;
      }
    }

    return filterOperator;
  }

  protected removeDynamicFilterOperatorFromValue(value: string, filterOperator: FilterOperator): string {
    if (value.includes(filterOperator)) {
      value = substrReplace(value, '', 0, filterOperator.length);
    }

    return value;
  }
}
