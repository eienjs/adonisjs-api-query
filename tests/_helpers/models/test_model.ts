import { BaseModel, column } from '@adonisjs/lucid/orm';
import { AllowedSort } from '../../../src/allowed_sort.js';

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
}


void TestModel.query().allowedSorts(['name', 'fullName', AllowedSort.field('salary')]);
