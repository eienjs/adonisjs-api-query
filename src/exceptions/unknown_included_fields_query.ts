import { ResponseStatus } from '@adonisjs/core/http';
import { InvalidQuery } from './invalid_query.js';

export class UnknownIncludedFieldsQuery extends InvalidQuery {
  public readonly unknownFields: string[];

  public constructor(unknownFields: string[]) {
    const notAllowed = unknownFields.join(', ');
    const message = [
      `Requested field(s) \`${notAllowed}\` are not allowed (yet). `,
      "If you want to allow these fields, please make sure to call the QueryBuilder's `allowedFields` method before the `allowedIncludes` method",
    ].join('');

    super(message, { status: ResponseStatus.BadRequest });

    this.unknownFields = unknownFields;
  }
}
