import { type LucidModel, type ModelAttributes, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { SortDirection } from './enums/sort_direction.js';
import { InvalidDirection } from './exceptions/invalid_direction.js';
import { SortsCallback } from './sorts/sorts_callback.js';
import { SortsField } from './sorts/sorts_field.js';
import { type ExtractKeys, type Sort } from './types.js';

export class AllowedSort<Model extends LucidModel> {
  public static parseSortDirection(name: string): string {
    return name.startsWith('-') ? SortDirection.Descending : SortDirection.Ascending;
  }

  public static field<Model extends LucidModel>(
    name: string,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
  ): AllowedSort<Model> {
    return new AllowedSort<Model>(name, new SortsField<Model>(), internalName);
  }

  public static custom<Model extends LucidModel>(
    name: string,
    sortClass: Sort<Model>,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
  ): AllowedSort<Model> {
    return new AllowedSort<Model>(name, sortClass, internalName);
  }

  public static callback<Model extends LucidModel>(
    name: string,
    callback: (query: ModelQueryBuilderContract<Model>, descending: boolean, property: string) => void,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
  ): AllowedSort<Model> {
    return new AllowedSort<Model>(name, new SortsCallback<Model>(callback), internalName);
  }

  protected defaultDirection: string;

  protected internalName: string;

  protected name: string;

  protected sortClass: Sort<Model>;

  public constructor(
    name: string,
    sortClass: Sort<Model>,
    internalName?: ExtractKeys<ModelAttributes<InstanceType<Model>>>,
  ) {
    this.name = name.replace(/^-+/, '');
    this.defaultDirection = AllowedSort.parseSortDirection(name);
    this.sortClass = sortClass;
    this.internalName = internalName ?? this.name;
  }

  public sort(query: ModelQueryBuilderContract<Model>, descending?: boolean): void {
    descending = descending ?? this.defaultDirection === SortDirection.Descending;

    this.sortClass.handle(query, descending, this.internalName);
  }

  public getName(): string {
    return this.name;
  }

  public isSort(sortName: string): boolean {
    return this.name === sortName;
  }

  public getInternalName(): string {
    return this.internalName;
  }

  public setDefaultDirection(defaultDirection: string): this {
    if (!([SortDirection.Ascending, SortDirection.Descending] as string[]).includes(defaultDirection)) {
      throw InvalidDirection.make(defaultDirection);
    }

    this.defaultDirection = defaultDirection;

    return this;
  }
}
