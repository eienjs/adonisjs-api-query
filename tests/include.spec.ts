import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { test } from '@japa/runner';
import { AllowedInclude } from '../src/allowed_include.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import RelatedModel from './_helpers/models/related_model.js';
import TestModel from './_helpers/models/test_model.js';
import { createDbModels, setupApp } from './_helpers/test_utils.js';

const createQueryFromIncludeRequest = (includes: string) => {
  const request = new RequestFactory().create();
  request.updateQs({
    include: includes,
  });

  return TestModel.query().setRequest(request);
};

const createInitModels = async (app: ApplicationService, count: number) => {
  const models = await createDbModels(app, TestModelFactory, count);
  for (const model of models) {
    await model.related('relatedModels').create({ name: 'Test' });
  }

  return models;
};

test.group('include', (group) => {
  let app: ApplicationService;

  group.each.setup(async () => {
    app = await setupApp();
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();

    return () => app.terminate();
  });

  test('does not require includes', async ({ assert }) => {
    const models = await createInitModels(app, 5);
    const result = await TestModel.query()
      .setRequest(new RequestFactory().create())
      .allowedIncludes('relatedModels')
      .exec();

    assert.lengthOf(result, models.length);
  });

  test('can handle empty includes', async ({ assert }) => {
    const models = await createInitModels(app, 5);
    const result = await TestModel.query().setRequest(new RequestFactory().create()).allowedIncludes('').exec();

    assert.lengthOf(result, models.length);
  });

  test('can include model relations', async ({ assert }) => {
    const models = await createInitModels(app, 5);
    const result = await createQueryFromIncludeRequest('relatedModels').allowedIncludes('relatedModels').exec();

    assert.lengthOf(result, models.length);
    for (const resultModel of result) {
      assert.property(resultModel.$preloaded, 'relatedModels');
    }
  });

  test('can include model relations by alias', async ({ assert }) => {
    await createInitModels(app, 5);
    const models = await createQueryFromIncludeRequest('include_alias')
      .allowedIncludes(AllowedInclude.relationship('include_alias', 'relatedModels'))
      .exec();

    for (const resultModel of models) {
      assert.property(resultModel.$preloaded, 'relatedModels');
    }
  });

  test('can include an includes callback', async ({ assert }) => {
    await createInitModels(app, 5);
    const firstRelatedModel = await RelatedModel.firstOrFail();

    const models = await createQueryFromIncludeRequest('relatedModels')
      .allowedIncludes([
        AllowedInclude.callback<typeof TestModel, typeof RelatedModel>('relatedModels', (query) => {
          void query.where('id', firstRelatedModel.id);
        }),
      ])
      .exec();

    for (const resultModel of models) {
      assert.property(resultModel.$preloaded, 'relatedModels');
    }

    const [firstModel, ...rest] = models;
    assert.lengthOf(firstModel.relatedModels, 1);
    for (const otherModel of rest) {
      assert.lengthOf(otherModel.relatedModels, 0);
    }
  });

  test('can include and includes count', async ({ assert }) => {
    await createInitModels(app, 5);
    const model = await createQueryFromIncludeRequest('relatedModelsCount')
      .allowedIncludes('relatedModelsCount')
      .first();

    assert.exists(model?.$extras.relatedModelsCount);
  });

  test('allowing an include also allows the include count', async ({ assert }) => {
    await createInitModels(app, 5);
    const model = await createQueryFromIncludeRequest('relatedModelsCount').allowedIncludes('relatedModels').first();

    assert.exists(model?.$extras.relatedModelsCount);
  });
});
