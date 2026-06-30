import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations';
import { BaseModel, belongsTo, column, hasMany, scope } from '@adonisjs/lucid/orm';
import NestedRelatedModel from './nested_related_model.js';
import TestModel from './test_model.js';

type Builder = ModelQueryBuilderContract<typeof RelatedModel>;

export default class RelatedModel extends BaseModel {
  public static readonly namedScope = scope((scopeQuery, name: string) => {
    const query = scopeQuery as Builder;

    void query.where('name', name);
  });

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
}
