import { type DialectContract } from '@adonisjs/lucid/types/database';
import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type StrictValuesWithoutRaw } from '@adonisjs/lucid/types/querybuilder';
import { type Filter } from '../types.js';
import { FiltersExact } from './filters_exact.js';

export class FiltersPartial<Model extends LucidModel> extends FiltersExact<Model> implements Filter<Model> {
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
      if (value.filter((item) => item.toString().length > 0).length === 0) {
        return;
      }

      void query.where((subQuery) => {
        for (const partialValue of value.filter((item) => item.toString().length > 0)) {
          const [innerSql, innerBindings] = this.getWhereRawParameters(
            partialValue,
            this.parsePropertyToColumn(subQuery, property),
          );
          void subQuery.orWhereRaw(innerSql, innerBindings);
        }
      });

      return;
    }

    const [sql, bindings] = this.getWhereRawParameters(value, this.parsePropertyToColumn(query, property));
    void query.whereRaw(sql, bindings);
  }

  protected parsePropertyToColumn(
    query: ModelQueryBuilderContract<Model, InstanceType<Model>>,
    property: string,
  ): string {
    if (property.includes('.')) {
      return property;
    }

    return query.model.$getColumn(property)?.columnName ?? property;
  }

  protected getDatabaseDialect(query: ModelQueryBuilderContract<Model, InstanceType<Model>>): DialectContract['name'] {
    return query.client.dialect.name;
  }

  protected getWhereRawParameters(value: StrictValuesWithoutRaw | null, property: string): [string, string[]] {
    const resolvedValue = `${value}`.toLowerCase();

    return [`LOWER(??) LIKE ?`, [property, `%${FiltersPartial.escapeLike(resolvedValue)}%`]];
  }

  protected static escapeLike(value: string): string {
    return value
      .replaceAll('\\', '\\\\')
      .replaceAll('_', String.raw`\\_`)
      .replaceAll('%', String.raw`\\%`);
  }
}
