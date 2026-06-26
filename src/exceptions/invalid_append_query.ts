import { ResponseStatus } from '@adonisjs/core/http';
import { InvalidQuery } from './invalid_query.js';

export class InvalidAppendQuery extends InvalidQuery {
  public static appendsNotAllowed(appendsNotAllowed: string[], allowedAppends: string[]): InvalidAppendQuery {
    return new InvalidAppendQuery(appendsNotAllowed, allowedAppends);
  }

  public constructor(appendsNotAllowed: string[], allowedAppends: string[]) {
    const notAllowed = appendsNotAllowed.join(', ');
    const allowed = allowedAppends.join(', ');
    const message = `Requested append(s) \`${notAllowed}\` are not allowed. Allowed append(s) are \`${allowed}\``;

    super(message, { status: ResponseStatus.BadRequest });
  }
}
