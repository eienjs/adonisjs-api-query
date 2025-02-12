import { ResponseStatus } from '@adonisjs/core/http';
import { InvalidQuery } from './invalid_query.js';

export class InvalidFilterQuery extends InvalidQuery {
  public constructor(unknownFilters: string[], allowedFilters: string[]) {
    const notAllowed = unknownFilters.join(', ');
    const allowed = allowedFilters.join(', ');
    const message = `Requested filter(s) \`${notAllowed}\` are not allowed. Allowed filters(s) are \`${allowed}\``;

    super(message, { status: ResponseStatus.BadRequest });
  }

  public static filtersNotAllowed(unknownFilters: string[], allowedFilters: string[]): InvalidFilterQuery {
    return new InvalidFilterQuery(unknownFilters, allowedFilters);
  }
}
