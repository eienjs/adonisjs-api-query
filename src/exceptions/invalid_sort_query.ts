import { ResponseStatus } from '@adonisjs/core/http';
import { InvalidQuery } from './invalid_query.js';

export class InvalidSortQuery extends InvalidQuery {
  public constructor(
    public readonly unknownSorts: string[],
    public readonly allowedSorts: string[],
  ) {
    const notAllowed = unknownSorts.join(', ');
    const allowed = allowedSorts.join(', ');
    const message = `Requested sort(s) \`${notAllowed}\` is not allowed. Allowed sort(s) are \`${allowed}\``;

    super(message, { status: ResponseStatus.BadRequest });
  }

  public static sortsNotAllowed(unknownSorts: string[], allowedSorts: string[]): InvalidSortQuery {
    return new InvalidSortQuery(unknownSorts, allowedSorts);
  }
}
