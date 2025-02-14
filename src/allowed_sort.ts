import { SortDirection } from './enums/sort_direction.js';
import { SortsField } from './sorts/sorts_field.js';
import { type Sort } from './types.js';

export class AllowedSort {
  public static parseSortDirection(name: string): string {
    return name.startsWith('-') ? SortDirection.Descending : SortDirection.Ascending;
  }

  public static field(name: string, internalName?: string): AllowedSort {
    return new AllowedSort(name, new SortsField(), internalName);
  }

  protected defaultDirection: string;

  protected internalName: string;

  protected name: string;

  protected sortClass: Sort;

  public constructor(name: string, sortClass: Sort, internalName?: string) {
    this.name = name.replace(/^-+/, '');
    this.defaultDirection = AllowedSort.parseSortDirection(name);
    this.sortClass = sortClass;
    this.internalName = internalName ?? name;
  }
}
