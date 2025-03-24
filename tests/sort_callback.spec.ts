import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { test } from '@japa/runner';
import { Collection } from 'collect.js';
import { AllowedSort } from '../src/allowed_sort.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { SortDirection } from '../src/enums/sort_direction.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import TestModel from './_helpers/models/test_model.js';
import { createDbModels, setupApp } from './_helpers/test_utils.js';

const createQueryFromSortRequest = (sort?: string) => {
  const request = new RequestFactory().create();
  request.updateQs(sort ? { sort } : {});

  return TestModel.query().withRequest(request);
};

test.group('sort callback', (group) => {
  let app: ApplicationService;

  group.each.setup(async ({ context }) => {
    app = await setupApp(context, 'web');
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();

    return () => app.terminate();
  });

  test('should sort by closure', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromSortRequest('callback').allowedSorts(
      AllowedSort.callback('callback', (subQuery, descending) => {
        void subQuery.orderBy('name', descending ? SortDirection.Descending : SortDirection.Ascending);
      }),
    );
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });
});
