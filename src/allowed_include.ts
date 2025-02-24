import { type LucidModel } from '@adonisjs/lucid/types/model';
import { type ExtractModelRelations, type ModelRelations } from '@adonisjs/lucid/types/relations';
import { Collection } from 'collect.js';
import { IncludedCallback } from './includes/included_callback.js';
import { type Include } from './types.js';

export class AllowedInclude<Model extends LucidModel> {
  public static callback<Model extends LucidModel>(
    name: string,
    callback: (
      query: InstanceType<Model>[ExtractModelRelations<InstanceType<Model>>] extends ModelRelations<LucidModel>
        ? InstanceType<Model>[ExtractModelRelations<InstanceType<Model>>]['builder']
        : never,
    ) => void,
    internalName?: ExtractModelRelations<InstanceType<Model>>,
  ): Collection<AllowedInclude<Model>> {
    return new Collection([new AllowedInclude<Model>(name, new IncludedCallback<Model>(callback), internalName)]);
  }

  protected internalName: ExtractModelRelations<InstanceType<Model>>;

  protected name: string;

  protected includeClass: Include<Model>;

  public constructor(
    name: string,
    includeClass: Include<Model>,
    internalName?: ExtractModelRelations<InstanceType<Model>>,
  ) {
    this.name = name;
    this.includeClass = includeClass;
    this.internalName = internalName ?? (this.name as ExtractModelRelations<InstanceType<Model>>);
  }

  public getName(): string {
    return this.name;
  }

  public isForInclude(includeName: string): boolean {
    return this.name === includeName;
  }
}
