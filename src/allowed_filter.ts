import { type LucidModel, type ModelAttributes, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import { Collection } from 'collect.js';
import { ApiQueryBuilderRequest } from './api_query_builder_request.js';
import { type FilterOperator } from './enums/filter_operator.js';
import { FiltersBeginWithStrict } from './filters/filters_begin_with_strict.js';
import { FiltersCallback } from './filters/filters_callback.js';
import { FiltersEndsWithStrict } from './filters/filters_ends_with_strict.js';
import { FiltersExact } from './filters/filters_exact.js';
import { FiltersOperator } from './filters/filters_operator.js';
import { FiltersPartial } from './filters/filters_partial.js';
import { FiltersTrashed } from './filters/filters_trashed.js';
import { type ExtractKeys, type Filter } from './types.js';

export class AllowedFilter<Model extends LucidModel> {
  public static setFilterArrayValueDelimiter(delimiter?: string): void {
    if (delimiter) {
      ApiQueryBuilderRequest.setFilterArrayValueDelimiter(delimiter);
    }
  }

  public static exact<Model extends LucidModel>(
    name: string,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
    addRelationConstraint = true,
    arrayValueDelimiter?: string,
  ): AllowedFilter<Model> {
    this.setFilterArrayValueDelimiter(arrayValueDelimiter);

    return new AllowedFilter<Model>(name, new FiltersExact<Model>(addRelationConstraint), internalName);
  }

  public static partial<Model extends LucidModel>(
    name: string,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
    addRelationConstraint = true,
    arrayValueDelimiter?: string,
  ): AllowedFilter<Model> {
    this.setFilterArrayValueDelimiter(arrayValueDelimiter);

    return new AllowedFilter<Model>(name, new FiltersPartial<Model>(addRelationConstraint), internalName);
  }

  public static beginsWithStrict<Model extends LucidModel>(
    name: string,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
    addRelationConstraint = true,
    arrayValueDelimiter?: string,
  ): AllowedFilter<Model> {
    this.setFilterArrayValueDelimiter(arrayValueDelimiter);

    return new AllowedFilter<Model>(name, new FiltersBeginWithStrict<Model>(addRelationConstraint), internalName);
  }

  public static endsWithStrict<Model extends LucidModel>(
    name: string,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
    addRelationConstraint = true,
    arrayValueDelimiter?: string,
  ): AllowedFilter<Model> {
    this.setFilterArrayValueDelimiter(arrayValueDelimiter);

    return new AllowedFilter<Model>(name, new FiltersEndsWithStrict<Model>(addRelationConstraint), internalName);
  }

  public static callback<Model extends LucidModel>(
    name: string,
    callback: (query: ModelQueryBuilderContract<Model>, value: unknown, property: string) => void,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
    arrayValueDelimiter?: string,
  ): AllowedFilter<Model> {
    this.setFilterArrayValueDelimiter(arrayValueDelimiter);

    return new AllowedFilter<Model>(name, new FiltersCallback<Model>(callback), internalName);
  }

  public static trashed<Model extends LucidModel>(
    name = 'trashed',
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
  ): AllowedFilter<Model> {
    return new AllowedFilter<Model>(name, new FiltersTrashed<Model>(), internalName);
  }

  public static custom<Model extends LucidModel>(
    name: string,
    filterClass: Filter<Model>,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
    arrayValueDelimiter?: string,
  ): AllowedFilter<Model> {
    this.setFilterArrayValueDelimiter(arrayValueDelimiter);

    return new AllowedFilter<Model>(name, filterClass, internalName);
  }

  public static operator<Model extends LucidModel>(
    name: string,
    filterOperator: FilterOperator,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
    addRelationConstraint = true,
    arrayValueDelimiter?: string,
  ): AllowedFilter<Model> {
    this.setFilterArrayValueDelimiter(arrayValueDelimiter);

    return new AllowedFilter<Model>(
      name,
      new FiltersOperator<Model>(addRelationConstraint, filterOperator),
      internalName,
    );
  }

  protected name: string;

  protected filterClass: Filter<Model>;

  protected internalName: string;

  protected ignored: Collection<unknown>;

  protected default: unknown;

  protected $hasDefault = false;

  protected nullable = false;

  public constructor(
    name: string,
    filterClass: Filter<Model>,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
  ) {
    this.name = name;
    this.filterClass = filterClass;
    this.ignored = new Collection();
    this.internalName = internalName ?? this.name;
  }

  public filter(query: ModelQueryBuilderContract<Model>, value: unknown): void {
    const valueToFilter = this.resolveValueForFiltering(value);
    if (!this.nullable && valueToFilter === null) {
      return;
    }

    this.filterClass.handle(query, valueToFilter, this.internalName);
  }

  public getFilterClass(): Filter<Model> {
    return this.filterClass;
  }

  public getName(): string {
    return this.name;
  }

  public isForFilter(filterName: string): boolean {
    return this.name === filterName;
  }

  public ignore(...values: unknown[]): this {
    this.ignored = this.ignored.merge(values).flatten();

    return this;
  }

  public getIgnored(): unknown[] {
    return this.ignored.toArray();
  }

  public getInternalName(): string {
    return this.internalName;
  }

  public setDefault(defaultValue: unknown): this {
    this.default = defaultValue;
    this.$hasDefault = true;

    if (defaultValue === null) {
      this.setNullable(true);
    }

    return this;
  }

  public getDefault(): unknown {
    return this.default;
  }

  public hasDefault(): boolean {
    return this.$hasDefault;
  }

  public setNullable(nullable = true): this {
    this.nullable = nullable;

    return this;
  }

  public unsetDefault(): this {
    this.$hasDefault = false;
    this.default = undefined;

    return this;
  }

  protected resolveValueForFiltering(value: unknown): StrictValuesWithoutRaw | null {
    if (Array.isArray(value)) {
      const remainingProperties = value.map((subValue) => this.resolveValueForFiltering(subValue));

      return remainingProperties.length === 0 ? null : (remainingProperties as StrictValuesWithoutRaw);
    }

    return this.ignored.contains(value) ? null : (value as StrictValuesWithoutRaw);
  }
}
