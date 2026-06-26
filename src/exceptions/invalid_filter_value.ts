import { Exception } from '@adonisjs/core/exceptions';

export class InvalidFilterValue extends Exception {
  public static make(value: unknown): InvalidFilterValue {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return new InvalidFilterValue(`Filter value \`${value}\` is invalid`);
  }
}
