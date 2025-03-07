import { URL } from 'node:url';
import { IgnitorFactory } from '@adonisjs/core/factories';
import { RequestFactory } from '@adonisjs/core/factories/http';
import { type ApplicationService } from '@adonisjs/core/types';
import { type AppEnvironments } from '@adonisjs/core/types/app';
import { defineConfig as defineLucidConfig } from '@adonisjs/lucid';
import { type Database } from '@adonisjs/lucid/database';
import { type FactoryBuilderQueryContract, type FactoryModelContract } from '@adonisjs/lucid/types/factory';
import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { getActiveTest } from '@japa/runner';
import { defineConfig } from '../../src/define_config.js';
import { type ApiQueryConfig } from '../../src/types.js';
import TestModel from './models/test_model.js';

const BASE_URL = new URL('tmp/', import.meta.url);

export const defaultConfigApiQuery: ApiQueryConfig = {
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

export const setupApp = async function (
  env?: AppEnvironments,
  config: { database?: ReturnType<typeof defineLucidConfig>; apiquery?: ReturnType<typeof defineConfig> } = {},
): Promise<ApplicationService> {
  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .merge({
      config: {
        database:
          config.database ??
          defineLucidConfig({
            connection: 'sqlite',
            connections: {
              sqlite: {
                client: 'better-sqlite3',
                connection: { filename: 'db.sqlite3' },
                useNullAsDefault: true,
              },
            },
          }),
        apiquery: config.apiquery ?? defineConfig(defaultConfigApiQuery),
      },
      rcFileContents: {
        providers: [
          () => import('@adonisjs/lucid/database_provider'),
          () => import('adonis-lucid-soft-deletes/provider'),
          () => import('../../providers/api_query_provider.js'),
        ],
      },
    })
    .create(BASE_URL, {
      importer: (filePath) => {
        if (filePath.startsWith('./') || filePath.startsWith('../')) {
          return import(new URL(filePath, BASE_URL).href);
        }

        return import(filePath);
      },
    });

  const app = ignitor.createApp(env || 'web');
  await app.init();
  await app.boot();

  return app;
};

export const setupDatabase = async (db: Database) => {
  const test = getActiveTest();
  if (!test) {
    throw new Error('Cannot use "createTables" outside of a Japa test');
  }

  test.cleanup(async () => {
    await db.connection().schema.dropTableIfExists('test_models');
    await db.connection().schema.dropTableIfExists('soft_delete_models');
    await db.connection().schema.dropTableIfExists('related_models');
    await db.connection().schema.dropTableIfExists('nested_related_models');
    await db.connection().schema.dropTableIfExists('pivot_models');
    await db.connection().schema.dropTableIfExists('related_through_pivot_models');
  });

  await db.connection().schema.createTable('test_models', (table) => {
    table.increments('id');
    table.string('name').nullable();
    table.string('full_name').nullable();
    table.double('salary').nullable();
    table.boolean('is_visible').defaultTo(true);
    table.timestamps();
  });

  await db.connection().schema.createTable('soft_delete_models', (table) => {
    table.increments('id');
    table.string('name');
    table.timestamp('deleted_at').nullable();
  });

  await db.connection().schema.createTable('related_models', (table) => {
    table.increments('id');
    table.integer('test_model_id');
    table.string('name');
    table.string('full_name').nullable();
  });

  await db.connection().schema.createTable('nested_related_models', (table) => {
    table.increments('id');
    table.integer('related_model_id');
    table.string('name');
  });

  await db.connection().schema.createTable('pivot_models', (table) => {
    table.increments('id');
    table.integer('test_model_id');
    table.integer('related_through_pivot_model_id');
    table.string('location').nullable();
  });

  await db.connection().schema.createTable('related_through_pivot_models', (table) => {
    table.increments('id');
    table.string('name');
  });
};

export const createDbModels = async <Model extends LucidModel, FactoryModel extends FactoryModelContract<Model>>(
  app: ApplicationService,
  factory: FactoryBuilderQueryContract<Model, FactoryModel>,
  count: number,
) => {
  const db = await app.container.make('lucid.db');
  await setupDatabase(db);
  const models = await factory.createMany(count);

  return models;
};

export const createQueryFromFilterRequest = <Model extends LucidModel = typeof TestModel>(
  filters: unknown,
  model?: Model,
): ModelQueryBuilderContract<Model> => {
  const TargetModel = model ?? TestModel;

  const request = new RequestFactory().create();
  request.updateQs({
    filter: filters,
  });

  return TargetModel.query().setRequest(request) as ModelQueryBuilderContract<Model>;
};
