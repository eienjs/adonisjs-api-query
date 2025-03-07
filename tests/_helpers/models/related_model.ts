import { BaseModel, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm';
import { type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type BelongsTo, type HasMany } from '@adonisjs/lucid/types/relations';
import NestedRelatedModel from './nested_related_model.js';
import TestModel from './test_model.js';

type Builder = ModelQueryBuilderContract<typeof RelatedModel>;

export default class RelatedModel extends BaseModel {
  @column({ isPrimary: true })
  declare public id: number;

  @column()
  declare public name: string;

  @column()
  declare public fullName: string | null;

  @column()
  declare public testModelId: number;

  @belongsTo(() => TestModel)
  declare public testModel: BelongsTo<typeof TestModel>;

  @hasMany(() => NestedRelatedModel)
  declare public nestedRelatedModels: HasMany<typeof NestedRelatedModel>;

  public static readonly namedScope = scope((scopeQuery, name: string) => {
    const query = scopeQuery as Builder;

    void query.where('name', name);
  });
}
