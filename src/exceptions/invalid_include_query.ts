import { ResponseStatus } from '@adonisjs/core/http';
import { InvalidQuery } from './invalid_query.js';

export class InvalidIncludeQuery extends InvalidQuery {
  public constructor(
    public readonly unknownIncludes: string[],
    public readonly allowedIncludes: string[],
  ) {
    const notAllowed = unknownIncludes.join(', ');
    let message = `Requested include(s) \`${notAllowed}\` are not allowed. `;

    if (allowedIncludes.length > 0) {
      const allowed = allowedIncludes.join(', ');
      message = `${message}Allowed include(s) are \`${allowed}\``;
    } else {
      message = `${message}There are no allowed includes`;
    }

    super(message, { status: ResponseStatus.BadRequest });
  }

  public static includesNotAllowed(unknownIncludes: string[], allowedIncludes: string[]): InvalidIncludeQuery {
    return new InvalidIncludeQuery(unknownIncludes, allowedIncludes);
  }
}
