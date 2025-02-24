import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type ExtractModelRelations, type ModelRelations } from '@adonisjs/lucid/types/relations';
import { type Include } from '../types.js';

export class IncludedCallback<Model extends LucidModel> implements Include<Model> {
  public constructor(
    public readonly callback: (
      query: InstanceType<Model>[ExtractModelRelations<InstanceType<Model>>] extends ModelRelations<LucidModel>
        ? InstanceType<Model>[ExtractModelRelations<InstanceType<Model>>]['builder']
        : never,
    ) => void,
  ) {}

  public handle(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    include: ExtractModelRelations<InstanceType<Model>>,
  ): void {
    void query.preload(include, this.callback);
  }
}
