import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { AllowedFilter } from '../src/allowed_filter.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { SoftDeleteModelFactory } from './_helpers/factories/soft_delete_model.js';
import SoftDeleteModel from './_helpers/models/soft_delete_model.js';
import { createDbModels, createQueryFromFilterRequest, setupApp } from './_helpers/test_utils.js';

test.group('filter trashed', (group) => {
  let app: ApplicationService;

  group.each.setup(async ({ context }) => {
    app = await setupApp(context, 'web');
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();

    return () => app.terminate();
  });

  test('should filter not trashed by default', async ({ assert }) => {
    await createDbModels(app, SoftDeleteModelFactory, 2);
    await SoftDeleteModelFactory.merge({ deletedAt: DateTime.now() }).create();
    const resultModels = await createQueryFromFilterRequest({ trashed: '' }, SoftDeleteModel).allowedFilters(
      AllowedFilter.trashed(),
    );

    assert.lengthOf(resultModels, 2);
  });

  test('can filter only trashed', async ({ assert }) => {
    await createDbModels(app, SoftDeleteModelFactory, 2);
    await SoftDeleteModelFactory.merge({ deletedAt: DateTime.now() }).create();
    const resultModels = await createQueryFromFilterRequest({ trashed: 'only' }, SoftDeleteModel).allowedFilters(
      AllowedFilter.trashed(),
    );

    assert.lengthOf(resultModels, 1);
  });

  test('can filter only trashed by scope using callback', async ({ assert }) => {
    await createDbModels(app, SoftDeleteModelFactory, 2);
    await SoftDeleteModelFactory.merge({ deletedAt: DateTime.now() }).create();
    const resultModels = await createQueryFromFilterRequest({ onlyTrashed: true }, SoftDeleteModel).allowedFilters(
      AllowedFilter.callback('onlyTrashed', (query) => {
        void query.withScopes((scope) => scope.onlyTrashedScope());
      }),
    );

    assert.lengthOf(resultModels, 1);
  });

  test('can filter with trashed', async ({ assert }) => {
    await createDbModels(app, SoftDeleteModelFactory, 2);
    await SoftDeleteModelFactory.merge({ deletedAt: DateTime.now() }).create();
    const resultModels = await createQueryFromFilterRequest({ trashed: 'with' }, SoftDeleteModel).allowedFilters(
      AllowedFilter.trashed(),
    );

    assert.lengthOf(resultModels, 3);
  });
});
