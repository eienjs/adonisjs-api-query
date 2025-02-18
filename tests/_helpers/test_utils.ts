import { URL } from 'node:url';
import { IgnitorFactory } from '@adonisjs/core/factories';
import { type ApplicationService } from '@adonisjs/core/types';
import { type AppEnvironments } from '@adonisjs/core/types/app';
import { defineConfig as defineLucidConfig } from '@adonisjs/lucid';
import { type Database } from '@adonisjs/lucid/database';
import { type FactoryBuilderQueryContract, type FactoryModelContract } from '@adonisjs/lucid/types/factory';
import { type LucidModel } from '@adonisjs/lucid/types/model';
import { getActiveTest } from '@japa/runner';
import { defineConfig } from '../../src/define_config.js';

const BASE_URL = new URL('tmp/', import.meta.url);

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
        apiquery:
          config.apiquery ??
          defineConfig({
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
          }),
      },
      rcFileContents: {
        providers: [
          () => import('@adonisjs/lucid/database_provider'),
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
  await app.init().then(() => app.boot());

  return app as unknown as ApplicationService;
};

export const setupDatabase = async (db: Database) => {
  const test = getActiveTest();
  if (!test) {
    throw new Error('Cannot use "createTables" outside of a Japa test');
  }

  test.cleanup(async () => {
    await db.connection().schema.dropTableIfExists('test_models');
  });

  await db.connection().schema.createTable('test_models', (table) => {
    table.increments('id');
    table.string('name').nullable();
    table.string('full_name').nullable();
    table.double('salary').nullable();
    table.boolean('is_visible').defaultTo(true);
    table.timestamps();
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
