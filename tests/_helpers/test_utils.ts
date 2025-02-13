import { URL } from 'node:url';
import { IgnitorFactory } from '@adonisjs/core/factories';
import { type ApplicationService } from '@adonisjs/core/types';
import { type ResolvedApiQueryConfig } from '../../src/types.js';

const BASE_URL = new URL('tmp/', import.meta.url);

export const createApp = async (): Promise<ApplicationService> => {
  const ignitor = new IgnitorFactory().withCoreConfig().create(BASE_URL);
  const app = ignitor.createApp('web');
  await app.init();
  await app.boot();

  return app;
};

export const getDefaultConfig = (): ResolvedApiQueryConfig => {
  return {
    parameters: {
      include: 'include',
      filter: 'filter',
      sort: 'sort',
      fields: 'fields',
      append: 'append',
    },
    countSuffix: 'Count',
    existsSuffix: 'Exists',
    disableInvalidFilterQueryException: false,
    disableInvalidSortQueryException: false,
    disableInvalidIncludesQueryException: false,
    convertRelationNamesToSnakeCasePlural: false,
    convertRelationTableNameStrategy: false,
    convertFieldNamesToSnakeCase: false,
  };
};
