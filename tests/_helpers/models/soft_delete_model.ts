/// <reference types="@poppinss/hooks" />

import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { SoftDeletes } from 'adonis-lucid-soft-deletes';
import { type DateTime } from 'luxon';

export default class SoftDeleteModel extends compose(BaseModel, SoftDeletes) {
  @column({ isPrimary: true })
  declare public id: number;

  @column()
  declare public name: string;

  @column.dateTime()
  declare public deletedAt: DateTime | null;

  @column.dateTime({ autoCreate: true })
  declare public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare public updatedAt: DateTime | null;
}
