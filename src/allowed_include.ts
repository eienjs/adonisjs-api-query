import app from '@adonisjs/core/services/app';
import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type ModelRelations } from '@adonisjs/lucid/types/relations';
import { Collection } from 'collect.js';
import { IncludedCallback } from './includes/included_callback.js';
import { IncludedCount } from './includes/included_count.js';
import { IncludedRelationship } from './includes/included_relationship.js';
import { type Include } from './types.js';

export class AllowedInclude<Model extends LucidModel> {
  public static relationship<ParentModel extends LucidModel>(
    name: string,
    internalName?: string,
  ): Collection<AllowedInclude<ParentModel>> {
    internalName = internalName ?? name;

    return IncludedRelationship.getIndividualRelationshipPathsFromInclude(internalName)
      .zip(IncludedRelationship.getIndividualRelationshipPathsFromInclude(name).toArray<string>())
      .reduce((includes, args) => {
        const [relationship, alias] = args;

        includes = includes!.push(
          new AllowedInclude<ParentModel>(alias, new IncludedRelationship<ParentModel>(), relationship),
        );

        if (!relationship.includes('.')) {
          const countSuffix = app.config.get<string>('apiquery.countSuffix', 'Count');
          for (const countAllowedInclude of AllowedInclude.count(
            `${alias}${countSuffix}`,
            `${relationship}${countSuffix}`,
          )) {
            includes = includes.push(countAllowedInclude);
          }
        }

        return includes;
      }, new Collection<AllowedInclude<ParentModel>>()) as Collection<AllowedInclude<ParentModel>>;
  }

  public static count<ParentModel extends LucidModel>(
    name: string,
    internalName?: string,
  ): Collection<AllowedInclude<ParentModel>> {
    return new Collection([new AllowedInclude<ParentModel>(name, new IncludedCount<ParentModel>(), internalName)]);
  }

  public static callback<ParentModel extends LucidModel, RelatedModel extends LucidModel>(
    name: string,
    callback: (
      query:
        | ModelRelations<RelatedModel, ParentModel>['builder']
        | ModelRelations<RelatedModel, ParentModel>['subQuery'],
    ) => void,
    internalName?: string,
  ): Collection<AllowedInclude<ParentModel>> {
    return new Collection([
      new AllowedInclude<ParentModel>(name, new IncludedCallback<ParentModel, RelatedModel>(callback), internalName),
    ]);
  }

  public static custom<ParentModel extends LucidModel>(
    name: string,
    includeClass: Include<ParentModel>,
    internalName?: string,
  ): Collection<AllowedInclude<ParentModel>> {
    return new Collection([new AllowedInclude<ParentModel>(name, includeClass, internalName)]);
  }

  protected internalName: string;

  protected name: string;

  protected includeClass: Include<Model>;

  public constructor(name: string, includeClass: Include<Model>, internalName?: string) {
    this.name = name;
    this.includeClass = includeClass;
    this.internalName = internalName ?? this.name;
  }

  public include(query: ModelQueryBuilderContract<Model>): void {
    // if ('getRequestedFieldsForRelatedTable' in this.includeClass) {
    //   this.includeClass.getRequestedFieldsForRelatedTable = (relationship: string) => {
    //     return query.getRequestedFieldsForRelatedTable(relationship);
    //   };
    // }

    this.includeClass.handle(query, this.internalName);
  }

  public getName(): string {
    return this.name;
  }

  public isForInclude(includeName: string): boolean {
    return this.name === includeName;
  }
}
