import { BaseModel, belongsTo, column, hasMany, hasManyThrough, manyToMany, scope } from '@adonisjs/lucid/orm';
import { type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type BelongsTo, type HasMany, type HasManyThrough, type ManyToMany } from '@adonisjs/lucid/types/relations';
import { DateTime } from 'luxon';
import NestedRelatedModel from './nested_related_model.js';
import RelatedModel from './related_model.js';
import RelatedThroughPivotModel from './related_through_pivot_model.js';

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

  @hasMany(() => RelatedModel)
  declare public relatedModels: HasMany<typeof RelatedModel>;

  @belongsTo(() => RelatedModel)
  declare public relatedModel: BelongsTo<typeof RelatedModel>;

  @hasManyThrough([() => NestedRelatedModel, () => RelatedModel])
  declare public nestedRelatedModels: HasManyThrough<typeof NestedRelatedModel>;

  @hasMany(() => RelatedModel)
  declare public otherRelatedModels: HasMany<typeof RelatedModel>;

  @manyToMany(() => RelatedThroughPivotModel, {
    pivotTable: 'pivot_models',
  })
  declare public relatedThroughPivotModels: ManyToMany<typeof RelatedThroughPivotModel>;

  @manyToMany(() => RelatedThroughPivotModel, {
    pivotTable: 'pivot_models',
    pivotColumns: ['location'],
  })
  declare public relatedThroughPivotModelsWithPivot: ManyToMany<typeof RelatedThroughPivotModel>;

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
