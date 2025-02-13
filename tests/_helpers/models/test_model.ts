import { BaseModel, column } from '@adonisjs/lucid/orm';

export default class TextModel extends BaseModel {
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
}
