import { configProvider } from '@adonisjs/core';
import { type ConfigProvider } from '@adonisjs/core/types';
import { type ApiQueryConfig, type ResolvedApiQueryConfig } from './types.js';

export const defineConfig = function (config: ApiQueryConfig): ConfigProvider<ResolvedApiQueryConfig> {
  return configProvider.create(async (_) => {
    return {
      parameters: {
        include: config.parameters?.include ?? 'include',
        filter: config.parameters?.filter ?? 'filter',
        sort: config.parameters?.sort ?? 'sort',
        fields: config.parameters?.fields ?? 'fields',
        append: config.parameters?.append ?? 'append',
      },
      countSuffix: config.countSuffix ?? 'Count',
      existsSuffix: config.existsSuffix ?? 'Exists',
      disableInvalidFilterQueryException: config.disableInvalidFilterQueryException ?? false,
      disableInvalidSortQueryException: config.disableInvalidSortQueryException ?? false,
      disableInvalidIncludesQueryException: config.disableInvalidIncludesQueryException ?? false,
      convertRelationNamesToSnakeCasePlural: config.convertRelationNamesToSnakeCasePlural ?? false,
      convertRelationTableNameStrategy: config.convertRelationTableNameStrategy ?? false,
      convertFieldNamesToSnakeCase: config.convertFieldNamesToSnakeCase ?? false,
    };
  });
};
