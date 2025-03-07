import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm';
import { type ManyToMany } from '@adonisjs/lucid/types/relations';
import TestModel from './test_model.js';

export default class RelatedThroughPivotModel extends BaseModel {
  @column({ isPrimary: true })
  declare public id: number;

  @column()
  declare public name: string;

  @manyToMany(() => TestModel, {
    pivotTable: 'pivot_models',
  })
  declare public testModels: ManyToMany<typeof TestModel>;
}
