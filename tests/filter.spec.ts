import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { test } from '@japa/runner';
import collect from 'collect.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import TestModel from './_helpers/models/test_model.js';
import { createDbModels, setupApp } from './_helpers/test_utils.js';

const createQueryFromFilterRequest = <Model extends LucidModel>(
  filters: unknown,
  model?: Model,
): typeof model extends LucidModel ? ModelQueryBuilderContract<Model> : ModelQueryBuilderContract<typeof TestModel> => {
  const TargetModel = model ?? TestModel;

  const request = new RequestFactory().create();
  request.updateQs({
    filter: filters,
  });

  return TargetModel.query().setRequest(request) as typeof model extends LucidModel
    ? ModelQueryBuilderContract<Model>
    : ModelQueryBuilderContract<typeof TestModel>;
};

test.group('filter', (group) => {
  let app: ApplicationService;

  group.each.setup(async () => {
    app = await setupApp();
    setApp(app);

    return () => app.terminate();
  });

  test('can filter models by partial property by default', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    const resultModels = await createQueryFromFilterRequest({ name: models.at(0)?.name }).allowedFilters('name');

    assert.lengthOf(resultModels, 1);
  });

  test('can use a custom filter query string parameter', async ({ assert }) => {
    app.config.set('apiquery.parameters.filter', 'customFilter');
    const models = await createDbModels(app, TestModelFactory, 5);
    const request = new RequestFactory().create();
    request.updateQs({
      customFilter: {
        name: models.at(0)?.name,
      },
    });

    const resultModels = await TestModel.query().setRequest(request).allowedFilters('name');

    assert.lengthOf(resultModels, 1);
  });

  // TODO: fix this test
  test('can filter models by an record as filter value', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromFilterRequest({ name: { first: models.at(0)?.name } }).allowedFilters('name');
    console.info(query.toQuery());
    const resultModels = await query;

    assert.lengthOf(resultModels, 1);
  }).skip();

  test('can filter partially and case insensitive', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    const resultModels = await createQueryFromFilterRequest({ name: models.at(0)?.name?.toUpperCase() }).allowedFilters(
      'name',
    );

    assert.lengthOf(resultModels, 1);
  });

  test('can filter results based on the partial existence of a property in an array', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const model1 = await TestModelFactory.merge({ name: 'abcdef' }).create();
    const model2 = await TestModelFactory.merge({ name: 'uvwxyz' }).create();

    const resultModels = await createQueryFromFilterRequest({
      name: 'abc,xyz',
    }).allowedFilters('name');

    assert.lengthOf(resultModels, 2);
    assert.deepEqual(collect(resultModels).pluck('id').all(), [model1.id, model2.id]);
  });
});
