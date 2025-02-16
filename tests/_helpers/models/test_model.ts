import { BaseModel, column } from '@adonisjs/lucid/orm';
import { type DateTime } from 'luxon';

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
}
