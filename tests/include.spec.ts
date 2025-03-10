import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import { type ExtractModelRelations } from '@adonisjs/lucid/types/relations';
import { GLOBAL_STORE } from '@dpaskhin/unique';
import { test } from '@japa/runner';
import { type Collection } from 'collect.js';
import { AllowedInclude } from '../src/allowed_include.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { defineConfig } from '../src/define_config.js';
import { InvalidIncludeQuery } from '../src/exceptions/invalid_include_query.js';
import { type Include } from '../src/types.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import RelatedModel from './_helpers/models/related_model.js';
import TestModel from './_helpers/models/test_model.js';
import { createDbModels, defaultConfigApiQuery, setupApp } from './_helpers/test_utils.js';

const createQueryFromIncludeRequest = (includes: string) => {
  const request = new RequestFactory().create();
  request.updateQs({
    include: includes,
  });

  return TestModel.query().withRequest(request);
};

const createInitModels = async (app: ApplicationService, count: number) => {
  const models = await createDbModels(app, TestModelFactory, count);
  for (const model of models) {
    const relatedModel = await model.related('relatedModels').create({ name: 'Test' });
    await relatedModel.related('nestedRelatedModels').create({ name: 'Test' });

    await model.related('relatedThroughPivotModels').create({ id: model.id + 1, name: 'Test' });
  }

  return models;
};

test.group('include', (group) => {
  let app: ApplicationService;

  group.each.setup(async ({ context }) => {
    app = await setupApp(context, 'web');
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();
    GLOBAL_STORE.clear();

    return () => app.terminate();
  });

  test('does not require includes', async ({ assert }) => {
    const models = await createInitModels(app, 5);
    const result = await TestModel.query()
      .withRequest(new RequestFactory().create())
      .allowedIncludes('relatedModels')
      .exec();

    assert.lengthOf(result, models.length);
  });

  test('can handle empty includes', async ({ assert }) => {
    const models = await createInitModels(app, 5);
    const result = await TestModel.query().withRequest(new RequestFactory().create()).allowedIncludes('').exec();

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

    assert.exists(model?.$extras.relatedModels_count);
  });

  test('allowing an include also allows the include count', async ({ assert }) => {
    await createInitModels(app, 5);
    const model = await createQueryFromIncludeRequest('relatedModelsCount').allowedIncludes('relatedModels').first();

    assert.exists(model?.$extras.relatedModels_count);
  });

  test('can include nested model relations', async ({ assert }) => {
    await createInitModels(app, 5);
    const models = await createQueryFromIncludeRequest('relatedModels.nestedRelatedModels')
      .allowedIncludes('relatedModels.nestedRelatedModels')
      .exec();

    for (const model of models) {
      for (const relatedModel of model.relatedModels) {
        assert.property(relatedModel.$preloaded, 'nestedRelatedModels');
      }
    }
  });

  test('can include model relations from nested model relations', async ({ assert }) => {
    await createInitModels(app, 5);
    const models = await createQueryFromIncludeRequest('relatedModels')
      .allowedIncludes('relatedModels.nestedRelatedModels')
      .exec();

    for (const resultModel of models) {
      assert.property(resultModel.$preloaded, 'relatedModels');
    }
  });

  test('allowing a nested include only allows the include count for the first level', async ({ assert }) => {
    await createInitModels(app, 5);
    const model = await createQueryFromIncludeRequest('relatedModelsCount')
      .allowedIncludes('relatedModels.nestedRelatedModels')
      .first();

    assert.exists(model?.$extras.relatedModels_count);

    await assert.rejects(async () => {
      await createQueryFromIncludeRequest('nestedRelatedModelsCount')
        .allowedIncludes('relatedModels.nestedRelatedModels')
        .first();
    }, Error);

    await assert.rejects(async () => {
      await createQueryFromIncludeRequest('relatedModels.nestedRelatedModelsCount')
        .allowedIncludes('relatedModels.nestedRelatedModels')
        .first();
    }, Error);
  });

  test('can include models on an empty collection', async ({ assert }) => {
    await createInitModels(app, 0);
    const models = await createQueryFromIncludeRequest('relatedModels').allowedIncludes('relatedModels').exec();

    assert.lengthOf(models, 0);
  });

  test('guards against invalid includes', async () => {
    await createQueryFromIncludeRequest('randomModel').allowedIncludes('relatedModels').first();
  }).throws(/are not allowed./);

  test('doesnt throw invalid include query expection when disable in config', async (ctx) => {
    const { assert, cleanup } = ctx;
    await app.terminate();
    const customApp = await setupApp(ctx, 'web', {
      apiquery: defineConfig({
        ...defaultConfigApiQuery,
        disableInvalidIncludesQueryException: true,
      }),
    });
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();
    cleanup(() => customApp.terminate());
    await createInitModels(customApp, 0);
    await createQueryFromIncludeRequest('randomModel').allowedIncludes('relatedModels').exec();

    assert.isTrue(true);
  });

  test('can allow multiple includes', async ({ assert }) => {
    await createInitModels(app, 5);
    const models = await createQueryFromIncludeRequest('relatedModels')
      .allowedIncludes('relatedModels', 'otherRelatedModels')
      .exec();

    for (const resultModel of models) {
      assert.property(resultModel.$preloaded, 'relatedModels');
    }
  });

  test('can allow multiple includes as an array', async ({ assert }) => {
    await createInitModels(app, 5);
    const models = await createQueryFromIncludeRequest('relatedModels')
      .allowedIncludes(['relatedModels', 'otherRelatedModels'])
      .exec();

    for (const resultModel of models) {
      assert.property(resultModel.$preloaded, 'relatedModels');
    }
  });

  test('can remove duplicate includes from nested includes', ({ assert }) => {
    const query = createQueryFromIncludeRequest('relatedModels').allowedIncludes(
      'relatedModels.nestedRelatedModels',
      'relatedModels',
    );

    const includes = (
      query as unknown as { _allowedIncludes: Collection<AllowedInclude<typeof TestModel>> }
    )._allowedIncludes.map((allowedInclude) => allowedInclude.getName());

    assert.isTrue(includes.contains('relatedModels'));
    assert.isTrue(includes.contains('relatedModelsCount'));
    assert.isTrue(includes.contains('relatedModels.nestedRelatedModels'));
  });

  test('can include multiple model relations', async ({ assert }) => {
    await createInitModels(app, 5);
    const models = await createQueryFromIncludeRequest('relatedModels,otherRelatedModels')
      .allowedIncludes('relatedModels', 'otherRelatedModels')
      .exec();

    for (const resultModel of models) {
      assert.property(resultModel.$preloaded, 'relatedModels');
      assert.property(resultModel.$preloaded, 'otherRelatedModels');
    }
  });

  test('returns correct id when including many to many relationship', async ({ assert }) => {
    await createInitModels(app, 5);
    const models = await createQueryFromIncludeRequest('relatedThroughPivotModels')
      .allowedIncludes('relatedThroughPivotModels')
      .debug(true)
      .exec();

    const relatedModel = models[0].relatedThroughPivotModels[0];

    assert.equal(relatedModel.$extras.pivot_related_through_pivot_model_id, relatedModel.id);
  });

  test('an invalid include query exception contains the unknown and allowed includes', ({ assert }) => {
    const exception = new InvalidIncludeQuery(['unknown include'], ['allowed include']);

    assert.deepEqual(exception.unknownIncludes, ['unknown include']);
    assert.deepEqual(exception.allowedIncludes, ['allowed include']);
  });

  test('can alias multiple allowed includes', async ({ assert }) => {
    await createInitModels(app, 5);
    const request = new RequestFactory().create();
    request.updateQs({
      include: 'relatedModelsCount,relationShipAlias',
    });

    const models = await TestModel.query()
      .withRequest(request)
      .allowedIncludes([
        AllowedInclude.count('relatedModelsCount'),
        AllowedInclude.relationship('relationShipAlias', 'otherRelatedModels'),
      ])
      .exec();

    for (const resultModel of models) {
      assert.property(resultModel.$preloaded, 'otherRelatedModels');
      assert.exists(resultModel.$extras.relatedModels_count);
    }
  });

  test('can include custom include class', async ({ assert }) => {
    const includeClass = new (class implements Include<typeof TestModel> {
      public handle(query: ModelQueryBuilderContract<typeof TestModel, TestModel>, include: string): void {
        void query.withCount(include as ExtractModelRelations<TestModel>);
      }
    })();
    await createInitModels(app, 5);
    const modelResult = await createQueryFromIncludeRequest('relatedModels')
      .allowedIncludes(AllowedInclude.custom('relatedModels', includeClass, 'relatedModels'))
      .first();

    assert.exists(modelResult?.$extras.relatedModels_count);
  });

  test('can include custom include class by alias', async ({ assert }) => {
    const includeClass = new (class implements Include<typeof TestModel> {
      public handle(query: ModelQueryBuilderContract<typeof TestModel, TestModel>, include: string): void {
        void query.withCount(include as ExtractModelRelations<TestModel>);
      }
    })();
    await createInitModels(app, 5);
    const modelResult = await createQueryFromIncludeRequest('relatedModelsCount')
      .allowedIncludes(AllowedInclude.custom('relatedModelsCount', includeClass, 'relatedModels'))
      .first();

    assert.exists(modelResult?.$extras.relatedModels_count);
  });
});
