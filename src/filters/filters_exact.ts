import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import { type ExtractModelRelations } from '@adonisjs/lucid/types/relations';
import collect, { type Collection } from 'collect.js';
import { type Filter } from '../types.js';

export class FiltersExact<Model extends LucidModel> implements Filter<Model> {
  protected relationConstraints: string[] = [];

  public constructor(protected addRelationConstraint = true) {}

  public handle(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    value: StrictValuesWithoutRaw | null,
    property: string,
  ): void {
    if (this.addRelationConstraint && this.isRelationProperty(query, property)) {
      this.withRelationConstraint(query, value, property);

      return;
    }

    if (Array.isArray(value)) {
      void query.whereIn(this.qualifyColumn(query, property), value);

      return;
    }

    if (value === null) {
      void query.whereNull(this.qualifyColumn(query, property));

      return;
    }

    void query.where(this.qualifyColumn(query, property), '=', value);
  }

  protected qualifyColumn(query: ModelQueryBuilderContract<Model, InstanceType<Model>>, column: string): string {
    if (column.includes('.')) {
      return column;
    }

    return `${query.model.table}.${query.model.$getColumn(column)?.columnName}`;
  }

  protected isRelationProperty(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    property: string,
  ): boolean {
    if (!property.includes('.')) {
      return false;
    }

    if (this.relationConstraints.includes(property)) {
      return false;
    }

    const firstRelationShip = property.split('.')[0];

    return query.model.$relationsDefinitions.has(firstRelationShip);
  }

  protected withRelationConstraint(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    value: StrictValuesWithoutRaw | null,
    property: string,
  ): void {
    const [relation, relationProperty] = collect(property.split('.')).pipe((parts: Collection<string>) => {
      const rProperty = parts.pop();
      const rPath = parts.implode('.');

      return [rPath as ExtractModelRelations<InstanceType<Model>>, rProperty];
    });

    void query.whereHas(relation, (subQuery: ModelQueryBuilderContract<Model>) => {
      const columnName = this.qualifyColumn(subQuery, relationProperty);
      this.relationConstraints.push(columnName);

      this.handle(subQuery, value, columnName);
    });
  }
}
