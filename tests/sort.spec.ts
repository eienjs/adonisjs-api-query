import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { test } from '@japa/runner';
import TestModel from './_helpers/models/test_model.js';
import { setupApp } from './_helpers/test_utils.js';

const createQueryFromSortRequest = (sort?: string) => {
  const request = new RequestFactory().create();
  request.updateQs(sort ? { sort } : {});

  return TestModel.query().setRequest(request);
};

test.group('sort', (group) => {
  let app: ApplicationService;

  group.each.setup(async () => {
    app = await setupApp();
    setApp(app);

    return () => app.terminate();
  });

  test('can sort a query ascending', ({ assert }) => {
    const query = createQueryFromSortRequest('name').allowedSorts('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
  });
});
