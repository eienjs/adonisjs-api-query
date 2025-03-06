import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { test } from '@japa/runner';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import TestModel from './_helpers/models/test_model.js';
import { createDbModels, setupApp } from './_helpers/test_utils.js';

const createQueryFromIncludeRequest = (includes: string) => {
  const request = new RequestFactory().create();
  request.updateQs({
    include: includes,
  });

  return TestModel.query().setRequest(request);
};

test.group('include', (group) => {
  let app: ApplicationService;

  group.each.setup(async () => {
    app = await setupApp();
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();

    return () => app.terminate();
  });

  test('can include model relations', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    for (const model of models) {
      await model.related('relatedModels').create({ name: 'Test' });
    }
    const result = await createQueryFromIncludeRequest('relatedModels').allowedIncludes('relatedModels').exec();

    assert.lengthOf(result, 5);
    for (const resultModel of result) {
      assert.property(resultModel.$preloaded, 'relatedModels');
    }
  });
});
