import { Exception } from '@adonisjs/core/exceptions';
import { SortDirection } from '../enums/sort_direction.js';

export class InvalidDirection extends Exception {
  public static make(sort: string): InvalidDirection {
    return new InvalidDirection(
      `The direction should be either \`${SortDirection.Descending}\` or \`${SortDirection.Ascending}\` ${sort} given`,
    );
  }
}
