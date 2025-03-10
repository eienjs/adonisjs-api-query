import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { GLOBAL_STORE } from '@dpaskhin/unique';
import { test } from '@japa/runner';
import { AllowedFilter } from '../src/allowed_filter.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import { createDbModels, createQueryFromFilterRequest, setupApp } from './_helpers/test_utils.js';

test.group('filter callback', (group) => {
  let app: ApplicationService;

  group.each.setup(async ({ context }) => {
    app = await setupApp(context, 'web');
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();
    GLOBAL_STORE.clear();

    return () => app.terminate();
  });

  test('should filter by closure', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    const resultModels = await createQueryFromFilterRequest({
      callback: models.at(0)?.name,
    }).allowedFilters(
      AllowedFilter.callback('callback', (query, value) => {
        void query.where('name', value as string);
      }),
    );

    assert.lengthOf(resultModels, 1);
  });
});
