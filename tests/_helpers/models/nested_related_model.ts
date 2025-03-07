import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import { type BelongsTo } from '@adonisjs/lucid/types/relations';
import RelatedModel from './related_model.js';

export default class NestedRelatedModel extends BaseModel {
  @column({ isPrimary: true })
  declare public id: number;

  @column()
  declare public name: string;

  @column()
  declare public relatedModelId: number;

  @belongsTo(() => RelatedModel)
  declare public relatedModel: BelongsTo<typeof RelatedModel>;
}
