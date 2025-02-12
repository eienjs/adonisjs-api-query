import { Exception } from '@adonisjs/core/exceptions';

export class AllowedFieldsMustBeCalledBeforeAllowedIncludes extends Exception {
  public static readonly code: 'E_BAD_METHOD_CALL_EXCEPTION';

  public static readonly status: 500;

  public constructor() {
    super("The QueryBuilder's `allowedFields` method must be called before the `allowedIncludes` method");
  }
}
