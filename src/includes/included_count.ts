import app from '@adonisjs/core/services/app';
import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type ExtractModelRelations } from '@adonisjs/lucid/types/relations';
import { type Include } from '../types.js';

export class IncludedCount<ParentModel extends LucidModel> implements Include<ParentModel> {
  public handle(query: ModelQueryBuilderContract<ParentModel, InstanceType<ParentModel>>, count: string): void {
    const suffix = app.config.get<string>('apiquery.countSuffix', 'Count');
    const relation = (count.endsWith(suffix) ? count.slice(0, -suffix.length) : count) as ExtractModelRelations<
      InstanceType<ParentModel>
    >;

    void query.withCount(relation);
  }
}
