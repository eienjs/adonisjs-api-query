import { Exception } from '@adonisjs/core/exceptions';

export abstract class InvalidQuery extends Exception {
  public static readonly code = 'E_INVALID_QUERY_EXCEPTION';
}
