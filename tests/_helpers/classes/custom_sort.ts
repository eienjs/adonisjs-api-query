import { type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type Sort } from '../../../src/types.js';
import type TestModel from '../models/test_model.js';

export default class CustomSort implements Sort<typeof TestModel> {
  public handle(q: ModelQueryBuilderContract<typeof TestModel>, descending: boolean, _property: string): void {
    void q.orderBy('name', descending ? 'desc' : 'asc');
  }
}
