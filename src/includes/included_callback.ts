import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type ExtractModelRelations, type ModelRelations } from '@adonisjs/lucid/types/relations';
import { type Include } from '../types.js';

export class IncludedCallback<ParentModel extends LucidModel, RelatedModel extends LucidModel>
  implements Include<ParentModel>
{
  public constructor(
    public readonly callback: (
      query:
        | ModelRelations<RelatedModel, ParentModel>['builder']
        | ModelRelations<RelatedModel, ParentModel>['subQuery'],
    ) => void,
  ) {}

  public handle(query: ModelQueryBuilderContract<ParentModel, InstanceType<ParentModel>>, include: string): void {
    void query.preload(include as ExtractModelRelations<InstanceType<ParentModel>>, this.callback);
  }
}
