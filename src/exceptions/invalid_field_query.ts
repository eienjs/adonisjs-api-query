import { ResponseStatus } from '@adonisjs/core/http';
import { InvalidQuery } from './invalid_query.js';

export class InvalidFieldQuery extends InvalidQuery {
  public constructor(unknownFields: string[], allowedFields: string[]) {
    const notAllowed = unknownFields.join(', ');
    const allowed = allowedFields.join(', ');
    const message = `Requested field(s) \`${notAllowed}\` are not allowed. Allowed field(s) are \`${allowed}\``;

    super(message, { status: ResponseStatus.BadRequest });
  }

  public static fieldsNotAllowed(unknownFields: string[], allowedFields: string[]): InvalidFieldQuery {
    return new InvalidFieldQuery(unknownFields, allowedFields);
  }
}
