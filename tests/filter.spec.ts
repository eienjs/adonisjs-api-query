import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { GLOBAL_STORE } from '@dpaskhin/unique';
import { test } from '@japa/runner';
import collect from 'collect.js';
import { DateTime } from 'luxon';
import { AllowedFilter } from '../src/allowed_filter.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { defineConfig } from '../src/define_config.js';
import { FilterOperator } from '../src/enums/filter_operator.js';
import { InvalidFilterQuery } from '../src/exceptions/invalid_filter_query.js';
import { InvalidFilterValue } from '../src/exceptions/invalid_filter_value.js';
import { FiltersExact } from '../src/filters/filters_exact.js';
import CustomFilter from './_helpers/classes/custom_filter.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import TestModel from './_helpers/models/test_model.js';
import {
  createDbModels,
  createQueryFromFilterRequest,
  defaultConfigApiQuery,
  setupApp,
} from './_helpers/test_utils.js';

test.group('filter', (group) => {
  let app: ApplicationService;

  group.each.setup(async ({ context }) => {
    app = await setupApp(context, 'web');
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();
    GLOBAL_STORE.clear();

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
    const resultModels = await TestModel.query().withRequest(request).allowedFilters('name');

    assert.lengthOf(resultModels, 1);
  });

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

  test('can filter models and return an empty collection', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const resultModels = await createQueryFromFilterRequest({
      name: 'None exisiting first name',
    }).allowedFilters('name');

    assert.lengthOf(resultModels, 0);
  });

  test('can filter a custom base query with select', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        name: 'john',
      },
    });
    const queryBuilderSql = TestModel.query()
      .select('id', 'name')
      .withRequest(request)
      .allowedFilters('name', 'id')
      .toQuery();
    const expectedSql = TestModel.query()
      .select('id', 'name')
      .whereRaw('LOWER(??) LIKE ?', ['name', '%john%'])
      .toQuery();

    assert.equal(queryBuilderSql, expectedSql);
  });

  test('can filter results based on the existence of a property in an array', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const results = await createQueryFromFilterRequest({
      id: '1,2',
    }).allowedFilters(AllowedFilter.exact('id'));

    assert.lengthOf(results, 2);
    assert.deepEqual(collect(results).pluck('id').all(), [1, 2]);
  });

  test('ignores empty values in an array partial filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const results = await createQueryFromFilterRequest({
      id: '2,',
    }).allowedFilters(AllowedFilter.exact('id'));

    assert.lengthOf(results, 1);
    assert.deepEqual(collect(results).pluck('id').all(), [2]);
  });

  test('falsy values are not ignored when applying a partial filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromFilterRequest({
      id: [0],
    })
      .allowedFilters(AllowedFilter.partial('id'))
      .toQuery();

    assert.include(query, 'select * from `test_models` where (LOWER(`id`) LIKE');
  });

  test('falsy values are not ignored when applying a begins with strict filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromFilterRequest({
      id: [0],
    })
      .allowedFilters(AllowedFilter.beginsWithStrict('id'))
      .toQuery();

    assert.include(query, 'select * from `test_models` where (id LIKE');
  });

  test('falsy values are not ignored when applying a ends with strict filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromFilterRequest({
      id: [0],
    })
      .allowedFilters(AllowedFilter.endsWithStrict('id'))
      .toQuery();

    assert.include(query, 'select * from `test_models` where (id LIKE');
  });

  test('can filter partial using begins with strict', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ fullName: 'John Doe' }).create();
    const models = await createQueryFromFilterRequest({
      fullName: 'john',
    }).allowedFilters(AllowedFilter.beginsWithStrict('fullName'));
    const models2 = await createQueryFromFilterRequest({
      fullName: 'doe',
    }).allowedFilters(AllowedFilter.beginsWithStrict('fullName'));

    assert.lengthOf(models, 1);
    assert.lengthOf(models2, 0);
  });

  test('can filter partial using ends with strict', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'John Doe' }).create();
    const models = await createQueryFromFilterRequest({
      name: 'doe',
    }).allowedFilters(AllowedFilter.endsWithStrict('name'));
    const models2 = await createQueryFromFilterRequest({
      name: 'john',
    }).allowedFilters(AllowedFilter.endsWithStrict('name'));

    assert.lengthOf(models, 1);
    assert.lengthOf(models2, 0);
  });

  test('can filter and match results by exact property', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    const firstModel = models.at(0)!;
    const modelsResult = await createQueryFromFilterRequest({
      name: firstModel.name,
    }).allowedFilters(AllowedFilter.exact('name'));

    assert.lengthOf(modelsResult, 1);
    assert.deepEqual(modelsResult.at(0)!.id, firstModel.id);
  });

  test('can filter and reject results by exact property', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 3);
    await TestModelFactory.merge({ name: 'John Testing Doe' }).create();
    const modelsResult = await createQueryFromFilterRequest({
      name: 'Testing ',
    }).allowedFilters(AllowedFilter.exact('name'));

    assert.lengthOf(modelsResult, 0);
  });

  // TODO: handle next tests
  // it('can filter results by belongs to', function () {
  //     $relatedModel = RelatedModel::create(['name' => 'John Related Doe', 'test_model_id' => 0]);
  //     $nestedModel = NestedRelatedModel::create(['name' => 'John Nested Doe', 'related_model_id' => $relatedModel->id]);

  //     $modelsResult = createQueryFromFilterRequest(['relatedModel' => $relatedModel->id], NestedRelatedModel::class)
  //         ->allowedFilters(AllowedFilter::belongsTo('relatedModel'))
  //         ->get();

  //     expect($modelsResult)->toHaveCount(1);
  // });

  // it('can filter results by belongs to no match', function () {
  //     $relatedModel = RelatedModel::create(['name' => 'John Related Doe', 'test_model_id' => 0]);
  //     $nestedModel = NestedRelatedModel::create(['name' => 'John Nested Doe', 'related_model_id' => $relatedModel->id + 1]);

  //     $modelsResult = createQueryFromFilterRequest(['relatedModel' => $relatedModel->id], NestedRelatedModel::class)
  //         ->allowedFilters(AllowedFilter::belongsTo('relatedModel'))
  //         ->get();

  //     expect($modelsResult)->toHaveCount(0);
  // });

  // it('can filter results by belongs multiple', function () {
  //     $relatedModel1 = RelatedModel::create(['name' => 'John Related Doe 1', 'test_model_id' => 0]);
  //     $nestedModel1 = NestedRelatedModel::create(['name' => 'John Nested Doe 1', 'related_model_id' => $relatedModel1->id]);
  //     $relatedModel2 = RelatedModel::create(['name' => 'John Related Doe 2', 'test_model_id' => 0]);
  //     $nestedModel2 = NestedRelatedModel::create(['name' => 'John Nested Doe 2', 'related_model_id' => $relatedModel2->id]);

  //     $modelsResult = createQueryFromFilterRequest(['relatedModel' => $relatedModel1->id.','.$relatedModel2->id], NestedRelatedModel::class)
  //         ->allowedFilters(AllowedFilter::belongsTo('relatedModel'))
  //         ->get();

  //     expect($modelsResult)->toHaveCount(2);
  // });

  // it('can filter results by belongs multiple with different internal name', function () {
  //     $relatedModel1 = RelatedModel::create(['name' => 'John Related Doe 1', 'test_model_id' => 0]);
  //     $nestedModel1 = NestedRelatedModel::create(['name' => 'John Nested Doe 1', 'related_model_id' => $relatedModel1->id]);
  //     $relatedModel2 = RelatedModel::create(['name' => 'John Related Doe 2', 'test_model_id' => 0]);
  //     $nestedModel2 = NestedRelatedModel::create(['name' => 'John Nested Doe 2', 'related_model_id' => $relatedModel2->id]);

  //     $modelsResult = createQueryFromFilterRequest(['testFilter' => $relatedModel1->id.','.$relatedModel2->id], NestedRelatedModel::class)
  //         ->allowedFilters(AllowedFilter::belongsTo('testFilter', 'relatedModel'))
  //         ->get();

  //     expect($modelsResult)->toHaveCount(2);
  // });

  // it('can filter results by belongs multiple with different internal name and nested model', function () {
  //     $testModel1 = TestModel::create(['name' => 'John Test Doe 1']);
  //     $relatedModel1 = RelatedModel::create(['name' => 'John Related Doe 1', 'test_model_id' => $testModel1->id]);
  //     $nestedModel1 = NestedRelatedModel::create(['name' => 'John Nested Doe 1', 'related_model_id' => $relatedModel1->id]);
  //     $testModel2 = TestModel::create(['name' => 'John Test Doe 2']);
  //     $relatedModel2 = RelatedModel::create(['name' => 'John Related Doe 2', 'test_model_id' => $testModel2->id]);
  //     $nestedModel2 = NestedRelatedModel::create(['name' => 'John Nested Doe 2', 'related_model_id' => $relatedModel2->id]);

  //     $modelsResult = createQueryFromFilterRequest(['test_filter' => $testModel1->id.','.$testModel2->id], NestedRelatedModel::class)
  //         ->allowedFilters(AllowedFilter::belongsTo('test_filter', 'relatedModel.testModel'))
  //         ->get();

  //     expect($modelsResult)->toHaveCount(2);
  // });

  // it('throws an exception when trying to filter by belongs to with an inexistent relation', function ($relationName, $exceptionClass) {
  //     $this->expectException($exceptionClass);

  //     $modelsResult = createQueryFromFilterRequest(['test_filter' => 1], RelatedModel::class)
  //         ->allowedFilters(AllowedFilter::belongsTo('test_filter', $relationName))
  //         ->get();

  // })->with([
  //     ['inexistentRelation', \BadMethodCallException::class],
  //     ['testModel.inexistentRelation', \BadMethodCallException::class], // existing 'testModel' belongsTo relation
  //     ['inexistentRelation.inexistentRelation', \BadMethodCallException::class],
  //     ['getTable', \Illuminate\Database\Eloquent\RelationNotFoundException::class],
  //     ['testModel.getTable', \Illuminate\Database\Eloquent\RelationNotFoundException::class], // existing 'testModel' belongsTo relation
  //     ['getTable.getTable', \Illuminate\Database\Eloquent\RelationNotFoundException::class],
  //     ['nestedRelatedModels', \Illuminate\Database\Eloquent\RelationNotFoundException::class], // existing 'nestedRelatedModels' relation but not a belongsTo relation
  //     ['testModel.relatedModels', \Illuminate\Database\Eloquent\RelationNotFoundException::class], // existing 'testModel' belongsTo relation and existing 'relatedModels' relation but not a belongsTo relation
  // ]);

  test('can filter results by scope using callback', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 3);
    await TestModelFactory.merge({ name: 'John Testing Doe' }).create();
    const modelsResult = await createQueryFromFilterRequest({
      named: 'John Testing Doe',
    }).allowedFilters(
      AllowedFilter.callback('named', (query, value) => {
        if (typeof value !== 'string') {
          throw InvalidFilterValue.make(value);
        }

        void query.withScopes((scope) => scope.namedScope(value));
      }),
    );

    assert.lengthOf(modelsResult, 1);
  });

  // it('can filter results by nested relation scope', function () {
  //     $testModel = TestModel::create(['name' => 'John Testing Doe']);

  //     $testModel->relatedModels()->create(['name' => 'John\'s Post']);

  //     $modelsResult = createQueryFromFilterRequest(['relatedModels.named' => 'John\'s Post'])
  //         ->allowedFilters(AllowedFilter::scope('relatedModels.named'))
  //         ->get();

  //     expect($modelsResult)->toHaveCount(1);
  // });

  test('can filter results by type hinted scope using callback', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 3);
    await TestModelFactory.merge({ name: 'John Testing Doe' }).create();
    const modelsResult = await createQueryFromFilterRequest({
      user: 1,
    }).allowedFilters(
      AllowedFilter.callback('user', (query, value) => {
        if (typeof value !== 'number') {
          throw InvalidFilterValue.make(value);
        }

        const user = new TestModel();
        user.id = value;

        void query.withScopes((scope) => scope.userScope(user));
      }),
    );

    assert.lengthOf(modelsResult, 1);
  });

  test('can filter results by regular and type hinted scope using callback', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 3);
    await TestModelFactory.merge({ id: 1000, name: 'John Testing Doe' }).create();
    const modelsResult = await createQueryFromFilterRequest({
      userInfo: {
        id: '1000',
        name: 'John Testing Doe',
      },
    }).allowedFilters(
      AllowedFilter.callback('userInfo', (query, value) => {
        if (typeof value !== 'object') {
          throw InvalidFilterValue.make(value);
        }

        const userInfo = value as { id: number; name: string };

        const user = new TestModel();
        user.id = userInfo.id;

        void query.withScopes((scope) => scope.userInfoScope(user, userInfo.name));
      }),
    );

    assert.lengthOf(modelsResult, 1);
  });

  test('can filter results by scope with multiple parameters using callback', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 3);
    await TestModelFactory.merge({ createdAt: DateTime.fromISO('2016-05-05') }).create();
    const modelsResult = await createQueryFromFilterRequest({
      createdBetween: '2016-01-01,2017-01-01',
    }).allowedFilters(
      AllowedFilter.callback('createdBetween', (query, value) => {
        const requestValue = value as [string, string];

        void query.withScopes((scope) => scope.createdBetweenScope(requestValue[0], requestValue[1]));
      }),
    );

    assert.lengthOf(modelsResult, 1);
  });

  test('can filter results by scope with multiple parameters using callback', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 1);
    await TestModelFactory.merge({ createdAt: DateTime.fromISO('2016-05-05') }).create();
    const modelsResult = await createQueryFromFilterRequest({
      createdBetween: {
        start: '2016-01-01',
        end: '2017-01-01',
      },
    }).allowedFilters(
      AllowedFilter.callback('createdBetween', (query, value) => {
        const requestValue = value as { start: string; end: string };
        void query.withScopes((scope) => scope.createdBetweenScope(requestValue.start, requestValue.end));
      }),
    );

    assert.lengthOf(modelsResult, 1);
  });

  test('can filter results by a custom filter class', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    const firstModel = models.at(0)!;
    const filterClass = new CustomFilter();
    const modelsResult = await createQueryFromFilterRequest({
      customName: firstModel.name,
    })
      .allowedFilters(AllowedFilter.custom('customName', filterClass))
      .firstOrFail();

    assert.equal(modelsResult.id, firstModel.id);
  });

  test('can allow multiple filters', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const model1 = await TestModelFactory.merge({ name: 'abcdef' }).create();
    const model2 = await TestModelFactory.merge({ name: 'abcdef' }).create();
    const results = await createQueryFromFilterRequest({
      name: 'abc',
    }).allowedFilters('name', AllowedFilter.exact('id'));

    assert.lengthOf(results, 2);
    assert.deepEqual(collect(results).pluck('id').all(), [model1.id, model2.id]);
  });

  test('can allow multiple filters as an array', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const model1 = await TestModelFactory.merge({ name: 'abcdef' }).create();
    const model2 = await TestModelFactory.merge({ name: 'abcdef' }).create();
    const results = await createQueryFromFilterRequest({
      name: 'abc',
    }).allowedFilters(['name', AllowedFilter.exact('id')]);

    assert.lengthOf(results, 2);
    assert.deepEqual(collect(results).pluck('id').all(), [model1.id, model2.id]);
  });

  test('can filter by multiple filters', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const model1 = await TestModelFactory.merge({ name: 'abcdef' }).create();
    await TestModelFactory.merge({ name: 'abcdef' }).create();
    const results = await createQueryFromFilterRequest({
      name: 'abc',
      id: `1,${model1.id}`,
    }).allowedFilters('name', AllowedFilter.exact('id'));

    assert.lengthOf(results, 1);
    assert.deepEqual(collect(results).pluck('id').all(), [model1.id]);
  });

  test('guards against invalid filters', () => {
    void createQueryFromFilterRequest({
      name: 'John',
    }).allowedFilters('id');
  }).throws(/ are not allowed. Allowed filter\(s\) are/);

  test('does not throw invalid filter exception when disable in config', async (ctx) => {
    const { assert, cleanup } = ctx;
    await app.terminate();
    const customApp = await setupApp(ctx, 'web', {
      apiquery: defineConfig({
        ...defaultConfigApiQuery,
        disableInvalidFilterQueryException: true,
      }),
    });
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();
    cleanup(() => customApp.terminate());

    const query = createQueryFromFilterRequest({
      name: 'John',
    }).allowedFilters('id');

    assert.equal(query.toQuery(), 'select * from `test_models`');
  });

  test('an invalid filter query exception contains the unknown and allowed filters', ({ assert }) => {
    const exception = InvalidFilterQuery.filtersNotAllowed(['unknown filter'], ['allowed filter']);

    assert.deepEqual(exception.unknownFilters, ['unknown filter']);
    assert.deepEqual(exception.allowedFilters, ['allowed filter']);
  });

  test('allows for adding ignorable values', ({ assert }) => {
    const shouldBeIgnored = ['', '-1', null, 'ignoredString', 'another_ignored_string'];
    const filter = AllowedFilter.exact('name').ignore(shouldBeIgnored[0]);
    filter.ignore(shouldBeIgnored[1], shouldBeIgnored[2]).ignore(shouldBeIgnored[3], shouldBeIgnored[4]);
    const valuesIgnoredByFilter = filter.getIgnored();

    assert.deepEqual(valuesIgnoredByFilter, shouldBeIgnored);
  });

  test('should not apply a filter if the supplied value is ignored', async ({ assert }) => {
    const models = await createDbModels(app, TestModelFactory, 5);
    const result = await createQueryFromFilterRequest({
      name: '-1',
    }).allowedFilters(AllowedFilter.exact('name').ignore('-1'));

    assert.lengthOf(result, models.length);
  });

  test('should apply the filter on the subset of allowed values', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 1);
    await TestModelFactory.merge({ name: 'John Doe' }).create();
    await TestModelFactory.merge({ name: 'John Deer' }).create();
    const result = await createQueryFromFilterRequest({
      name: 'John Deer,John Doe',
    }).allowedFilters(AllowedFilter.exact('name').ignore('John Doe'));

    assert.lengthOf(result, 1);
  });

  test('should apply the filter on the subset of allowed values regardless of the keys order', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 1);
    await TestModelFactory.merge({ id: 6, name: 'John Doe' }).create();
    await TestModelFactory.merge({ id: 7, name: 'John Deer' }).create();
    const result = await createQueryFromFilterRequest({
      id: [7, 6],
    }).allowedFilters(AllowedFilter.exact('id').ignore(6));

    assert.lengthOf(result, 1);
  });

  test('can take an argument for custom column name resolution', ({ assert }) => {
    /** @ts-expect-error: ignore for testing purposes */
    const filter = AllowedFilter.custom('propertyName', new FiltersExact(), 'propertyColumnName');

    assert.instanceOf(filter, AllowedFilter);
    assert.properties(filter, ['internalName']);
  });

  test('sets property column name to property name by default', ({ assert }) => {
    const filter = AllowedFilter.custom('propertyName', new FiltersExact());

    assert.equal(filter.getInternalName(), filter.getName());
  });

  test('resolves queries using property column name', async ({ assert }) => {
    const filter = AllowedFilter.custom<typeof TestModel>('nickname', new FiltersExact(), 'name');
    await createDbModels(app, TestModelFactory, 1);
    await TestModelFactory.merge({ name: 'abcdef' }).create();
    const models = await createQueryFromFilterRequest({
      nickname: 'abcdef',
    }).allowedFilters(filter);

    assert.lengthOf(models, 1);
  });

  test('can filter using boolean flags', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModel.query().update({ isVisible: true });
    const models = await createQueryFromFilterRequest({
      isVisible: false,
    }).allowedFilters(AllowedFilter.exact('isVisible'));
    const result = await TestModel.query().count('* as total');

    assert.lengthOf(models, 0);
    assert.isAbove(result[0].$extras.total as number, 0);
  });

  test('should apply a default filter value if nothing in request', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'UniqueJohn Doe' }).create();
    await TestModelFactory.merge({ name: 'UniqueJohn Deer' }).create();
    const models = await createQueryFromFilterRequest({}).allowedFilters(
      AllowedFilter.partial('name').setDefault('UniqueJohn'),
    );

    assert.lengthOf(models, 2);
  });

  test('does not apply default filter when filter exists and default is set', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'UniqueJohn UniqueDoe' }).create();
    await TestModelFactory.merge({ name: 'UniqueJohn Deer' }).create();
    const models = await createQueryFromFilterRequest({
      name: 'UniqueDoe',
    }).allowedFilters(AllowedFilter.partial('name').setDefault('UniqueJohn'));

    assert.lengthOf(models, 1);
  });

  test('should apply a null default filter value if nothing in request', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'UniqueJohn Doe' }).create();
    await TestModelFactory.merge({ name: null }).create();
    const models = await createQueryFromFilterRequest({}).allowedFilters(AllowedFilter.exact('name').setDefault(null));

    assert.lengthOf(models, 1);
  });

  test('does not apply default filter when filter exists and default null is set', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: null }).create();
    await TestModelFactory.merge({ name: 'UniqueJohn Deer' }).create();
    const models = await createQueryFromFilterRequest({
      name: 'UniqueJohn Deer',
    }).allowedFilters(AllowedFilter.exact('name').setDefault(null));

    assert.lengthOf(models, 1);
  });

  test('should apply a nullable filter when filter exists and is null', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: null }).create();
    await TestModelFactory.merge({ name: 'UniqueJohn Deer' }).create();
    const query = createQueryFromFilterRequest({
      name: null,
    }).allowedFilters(AllowedFilter.exact('name').setNullable());
    const models = await query.exec();

    assert.include(query.toQuery(), 'select * from `test_models` where `test_models`.`name` is null');
    assert.lengthOf(models, 1);
  });

  test('should filter by query parameters if a default value is set and unset afterwards', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'John Doe' }).create();

    const filterWithDefault = AllowedFilter.exact<typeof TestModel>('name').setDefault('some default value');
    const models = await createQueryFromFilterRequest({
      name: 'John Doe',
    }).allowedFilters(filterWithDefault.unsetDefault());

    assert.lengthOf(models, 1);
  });

  test('should not filter at all if a default value is set and unset afterwards', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const filterWithDefault = AllowedFilter.exact<typeof TestModel>('name').setDefault('some default value');
    const models = await createQueryFromFilterRequest({}).allowedFilters(filterWithDefault.unsetDefault());

    assert.lengthOf(models, 5);
  });

  test('should apply a filter with a multi-dimensional array value', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'John Doe' }).create();
    const models = await createQueryFromFilterRequest({
      conditions: [
        {
          attribute: 'name',
          operator: '=',
          value: 'John Doe',
        },
      ],
    }).allowedFilters(
      AllowedFilter.callback('conditions', (query, conditions) => {
        for (const condition of conditions as { attribute: string; operator: string; value: string }[]) {
          void query.where(condition.attribute, condition.operator, condition.value);
        }
      }),
    );

    assert.lengthOf(models, 1);
  });

  test('can override the array value delimiter for single filters', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: '>XZII/Q1On' }).create();
    await TestModelFactory.merge({ name: 'h4S4MG3(+>azv4z/I<o>' }).create();
    // First use default delimiter
    let models = await createQueryFromFilterRequest({
      ref_id: 'h4S4MG3(+>azv4z/I<o>,>XZII/Q1On',
    }).allowedFilters(AllowedFilter.exact('ref_id', 'name', true));

    assert.lengthOf(models, 2);

    // Custom delimiter
    models = await createQueryFromFilterRequest({
      ref_id: 'h4S4MG3(+>azv4z/I<o>|>XZII/Q1On',
    }).allowedFilters(AllowedFilter.exact('ref_id', 'name', true, '|'));

    assert.lengthOf(models, 2);

    // Custom delimiter, but default in request
    models = await createQueryFromFilterRequest({
      ref_id: 'h4S4MG3(+>azv4z/I<o>,>XZII/Q1On',
    }).allowedFilters(AllowedFilter.exact('ref_id', 'name', true, '|'));

    assert.lengthOf(models, 0);
  });

  test('can filter name with equal operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'John Doe' }).create();
    const results = await createQueryFromFilterRequest({
      name: 'John Doe',
    }).allowedFilters(AllowedFilter.operator('name', FilterOperator.Equal));

    assert.lengthOf(results, 1);
  });

  test('can filter name with not equal operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'John Doe' }).create();
    const results = await createQueryFromFilterRequest({
      name: 'John Doe',
    }).allowedFilters(AllowedFilter.operator('name', FilterOperator.NotEqual));

    assert.lengthOf(results, 5);
  });

  test('can filter salary with greater than operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ salary: 5000 }).create();
    const results = await createQueryFromFilterRequest({
      salary: 3000,
    }).allowedFilters(AllowedFilter.operator('salary', FilterOperator.GreaterThan));

    assert.lengthOf(results, 1);
  });

  test('can filter salary with less than operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ salary: 5000 }).create();
    const results = await createQueryFromFilterRequest({
      salary: 7000,
    }).allowedFilters(AllowedFilter.operator('salary', FilterOperator.LessThan));

    assert.lengthOf(results, 1);
  });

  test('can filter salary with greater than or equal operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ salary: 5000 }).create();
    const results = await createQueryFromFilterRequest({
      salary: 3000,
    }).allowedFilters(AllowedFilter.operator('salary', FilterOperator.GreaterThanOrEqual));

    assert.lengthOf(results, 1);
  });

  test('can filter salary with less than or equal operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ salary: 5000 }).create();
    const results = await createQueryFromFilterRequest({
      salary: 7000,
    }).allowedFilters(AllowedFilter.operator('salary', FilterOperator.LessThanOrEqual));

    assert.lengthOf(results, 1);
  });

  test('can filter array of names with equal operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ name: 'John Doe' }).create();
    await TestModelFactory.merge({ name: 'Max Doe' }).create();
    const query = createQueryFromFilterRequest({
      name: 'John Doe,Max Doe',
    }).allowedFilters(AllowedFilter.operator('name', FilterOperator.Equal, 'or'));
    const results = await query.exec();

    assert.lengthOf(results, 2);
  });

  test('can filter salary with dynamic operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ salary: 5000 }).create();
    await TestModelFactory.merge({ salary: 2000 }).create();
    const results = await createQueryFromFilterRequest({
      salary: '>2000',
    })
      .allowedFilters(AllowedFilter.operator('salary', FilterOperator.Dynamic))
      .exec();

    assert.lengthOf(results, 1);
  });

  test('can filter salary with dynamic array operator filter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    await TestModelFactory.merge({ salary: 1000 }).create();
    await TestModelFactory.merge({ salary: 2000 }).create();
    await TestModelFactory.merge({ salary: 3000 }).create();
    await TestModelFactory.merge({ salary: 4000 }).create();
    const results = await createQueryFromFilterRequest({
      salary: '>1000,<4000',
    })
      .allowedFilters(AllowedFilter.operator('salary', FilterOperator.Dynamic))
      .exec();

    assert.lengthOf(results, 2);
  });
});
