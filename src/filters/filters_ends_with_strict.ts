import { type LucidModel } from '@adonisjs/lucid/types/model';
import { type StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import { type Filter } from '../types.js';
import { FiltersPartial } from './filters_partial.js';

export class FiltersEndsWithStrict<Model extends LucidModel> extends FiltersPartial<Model> implements Filter<Model> {
  protected getWhereRawParameters(value: StrictValuesWithoutRaw, property: string): [string, string[]] {
    return [`${property} LIKE ?`, [`%${FiltersEndsWithStrict.escapeLike(value.toString())}`]];
  }
}
