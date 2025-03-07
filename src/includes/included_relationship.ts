import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type ExtractModelRelations, type ModelRelations } from '@adonisjs/lucid/types/relations';
import { Collection } from 'collect.js';
import { type Include } from '../types.js';

export class IncludedRelationship<ParentModel extends LucidModel> implements Include<ParentModel> {
  public static getIndividualRelationshipPathsFromInclude(include: string): Collection<string> {
    const originalInclude = new Collection(include.split('.'));

    return originalInclude.reduce((includes, relationship) => {
      const includesArray = includes ?? new Collection<string>();

      if (includesArray.isEmpty()) {
        return includesArray.push(relationship);
      }

      return includesArray.push(`${includes!.last()}.${relationship}`);
    }, new Collection<string>()) as Collection<string>;
  }

  public getRequestedFieldsForRelatedTable?: (relationship: string) => string[];

  public handle(query: ModelQueryBuilderContract<ParentModel, InstanceType<ParentModel>>, relationship: string): void {
    const relatedTables = relationship.split('.');

    if (relatedTables.length === 0) {
      return;
    }

    const [relation, ...rest] = relatedTables;

    if (!query.model.$hasRelation(relation)) {
      return;
    }

    void query.preload(relation as ExtractModelRelations<InstanceType<ParentModel>>, (subQuery) => {
      if (this.getRequestedFieldsForRelatedTable !== undefined) {
        const fields = this.getRequestedFieldsForRelatedTable(relation);
        if (fields.length > 0) {
          void subQuery.select(fields);
        }
      }

      this.buildNestedQuery(rest, subQuery, relation);
    });
  }

  private buildNestedQuery<SubParentModel extends LucidModel, SubRelatedModel extends LucidModel>(
    relatedTables: string[],
    subQuery:
      | ModelRelations<SubRelatedModel, SubParentModel>['builder']
      | ModelRelations<SubRelatedModel, SubParentModel>['subQuery'],
    parent = '',
  ): void {
    if (relatedTables.length === 0) {
      return;
    }

    const [relation, ...rest] = relatedTables;

    if (!subQuery.model.$hasRelation(relation)) {
      return;
    }

    void subQuery.preload(relation as ExtractModelRelations<InstanceType<SubRelatedModel>>, (nestedQuery) => {
      const fullRelationName = parent === '' ? relation : `${parent}.${relation}`;
      if (this.getRequestedFieldsForRelatedTable !== undefined) {
        const fields = this.getRequestedFieldsForRelatedTable(fullRelationName);
        if (fields.length > 0) {
          void nestedQuery.select(fields);
        }
      }

      this.buildNestedQuery(rest, nestedQuery, fullRelationName);
    });
  }
}
