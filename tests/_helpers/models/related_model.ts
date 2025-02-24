import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import { type BelongsTo } from '@adonisjs/lucid/types/relations';
import { type DateTime } from 'luxon';
import TestModel from './test_model.js';

export default class RelatedModel extends BaseModel {
  @column({ isPrimary: true })
  declare public id: number;

  @column()
  declare public name: string;

  @column()
  declare public fullName: string | null;

  @column()
  declare public testModelId: number;

  @column.dateTime({ autoCreate: true })
  declare public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare public updatedAt: DateTime | null;

  @belongsTo(() => TestModel)
  declare public testModel: BelongsTo<typeof TestModel>;
}
