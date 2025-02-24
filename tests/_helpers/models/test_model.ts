import { BaseModel, column, scope } from '@adonisjs/lucid/orm';
import { type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { DateTime } from 'luxon';

type Builder = ModelQueryBuilderContract<typeof TestModel>;

export default class TestModel extends BaseModel {
  @column({ isPrimary: true })
  declare public id: number;

  @column()
  declare public name: string | null;

  @column()
  declare public fullName: string | null;

  @column()
  declare public salary: number | null;

  @column()
  declare public isVisible: boolean;

  @column.dateTime({ autoCreate: true })
  declare public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare public updatedAt: DateTime | null;

  public static readonly namedScope = scope((scopeQuery, name: string) => {
    const query = scopeQuery as Builder;

    void query.where('name', name);
  });

  public static readonly userScope = scope((scopeQuery, user: TestModel) => {
    const query = scopeQuery as Builder;

    void query.where('id', user.id);
  });

  public static readonly userInfoScope = scope((scopeQuery, user: TestModel, name: string) => {
    const query = scopeQuery as Builder;

    void query.where('id', user.id).where('name', name);
  });

  public static readonly createdBetweenScope = scope((scopeQuery, from: string, to: string) => {
    const query = scopeQuery as Builder;

    void query.whereBetween('createdAt', [DateTime.fromISO(from).toSQL()!, DateTime.fromISO(to).toSQL()!]);
  });
}
