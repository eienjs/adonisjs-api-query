import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { GLOBAL_STORE } from '@dpaskhin/unique';
import { test } from '@japa/runner';
import { Collection } from 'collect.js';
import { DateTime } from 'luxon';
import { AllowedFilter } from '../src/allowed_filter.js';
import { AllowedSort } from '../src/allowed_sort.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { defineConfig } from '../src/define_config.js';
import { SortDirection } from '../src/enums/sort_direction.js';
import { InvalidSortQuery } from '../src/exceptions/invalid_sort_query.js';
import { SortsField } from '../src/sorts/sorts_field.js';
import CustomSort from './_helpers/classes/custom_sort.js';
import { TestModelFactory } from './_helpers/factories/test_model.js';
import TestModel from './_helpers/models/test_model.js';
import { createDbModels, defaultConfigApiQuery, setupApp, setupDatabase } from './_helpers/test_utils.js';

const createQueryFromSortRequest = (sort?: string) => {
  const request = new RequestFactory().create();
  request.updateQs(sort ? { sort } : {});

  return TestModel.query().withRequest(request);
};

test.group('sort', (group) => {
  let app: ApplicationService;

  group.each.setup(async ({ context }) => {
    app = await setupApp(context, 'web');
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();
    GLOBAL_STORE.clear();

    return () => app.terminate();
  });

  test('can sort a query ascending', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromSortRequest('name').allowedSorts('name');
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('has the allowed sorts property set even if no sorts are requested', ({ assert }) => {
    const query = createQueryFromSortRequest().allowedSorts('name');

    assert.isFalse((query as unknown as { _allowedSorts: Collection<unknown> })._allowedSorts.isEmpty());
  });

  test('can sort a query descending', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromSortRequest('-name').allowedSorts('name');
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortByDesc('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` desc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('can sort a query by alias', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromSortRequest('name-alias').allowedSorts(AllowedSort.field('name-alias', 'name'));
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('wont sort by columns that werent allowed first', ({ assert }) => {
    const query = createQueryFromSortRequest('name');

    assert.notInclude(query.toQuery(), 'order by `name`');
  });

  test('can allow a descending sort by still sort ascending', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromSortRequest('name').allowedSorts('-name');
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('can sort a query by a related property', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      sort: 'relatedModels.name',
      includes: 'relatedModels',
    });

    const query = TestModel.query()
      .withRequest(request)
      .allowedIncludes('relatedModels')
      .allowedSorts('relatedModels.name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `relatedModels`.`name` asc');
  });

  test('can sort by sketchy alias if its an allowed sort', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const query = createQueryFromSortRequest('-sketchy<>sort').allowedSorts(AllowedSort.field('sketchy<>sort', 'name'));
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortByDesc('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` desc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('can sort a query with custom select', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      sort: '-id',
    });

    const query = TestModel.query()
      .select('id', 'name')
      .withRequest(request)
      .allowedSorts('id')
      .defaultSort('id')
      .forPage(1, 15);

    assert.equal(query.toQuery(), 'select `id`, `name` from `test_models` order by `id` desc limit 15');
  });

  test('will throw an exception if a sort property is not allowed', () => {
    void createQueryFromSortRequest('name').allowedSorts('id');
  }).throws(/is not allowed/);

  test('does not throw invalid sort query exception when disable in config', async (ctx) => {
    const { assert, cleanup } = ctx;
    await app.terminate();
    const customApp = await setupApp(ctx, 'web', {
      apiquery: defineConfig({
        ...defaultConfigApiQuery,
        disableInvalidSortQueryException: true,
      }),
    });
    setApp(app);
    ApiQueryBuilderRequest.resetDelimiters();
    cleanup(() => customApp.terminate());
    const query = createQueryFromSortRequest('name').allowedSorts('id');

    assert.equal(query.toQuery(), 'select * from `test_models`');
  });

  test('an invalid sort query exception contains the unknown and allowed sorts', ({ assert }) => {
    const exception = InvalidSortQuery.sortsNotAllowed(['unknown sort'], ['allowed sort']);

    assert.deepEqual(exception.unknownSorts, ['unknown sort']);
    assert.deepEqual(exception.allowedSorts, ['allowed sort']);
  });

  test('wont sort sketchy sort requests', ({ assert }) => {
    const query = createQueryFromSortRequest('id->"\') asc --injection');

    assert.notInclude(query.toQuery(), '--injection');
  });

  test('uses default sort parameter when no sort was requested', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const request = new RequestFactory().create();
    const query = TestModel.query().withRequest(request).defaultSort('name');
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('doesnt use default sort parameter when a sort was requested', ({ assert }) => {
    const query = createQueryFromSortRequest('id').allowedSorts('id').defaultSort('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `id` asc');
  });

  test('allows default custom sort class parameter', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const request = new RequestFactory().create();
    const sortClass = new CustomSort();
    const query = TestModel.query()
      .withRequest(request)
      .allowedSorts(AllowedSort.custom('custom_name', sortClass))
      .defaultSort(AllowedSort.custom('custom_name', sortClass));
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('uses default descending sort parameter', ({ assert }) => {
    const query = createQueryFromSortRequest().allowedSorts('-name').defaultSort('-name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` desc');
  });

  test('allows multiple default sort parameters', ({ assert }) => {
    const sortClass = new CustomSort();
    const query = createQueryFromSortRequest()
      .allowedSorts(AllowedSort.custom('custom_name', sortClass), 'id')
      .defaultSort(AllowedSort.custom('custom_name', sortClass), '-id');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc, `id` desc');
  });

  test('allows multiple default sort parameters in an array', ({ assert }) => {
    const sortClass = new CustomSort();
    const query = createQueryFromSortRequest()
      .allowedSorts(AllowedSort.custom('custom_name', sortClass), 'id')
      .defaultSort([AllowedSort.custom('custom_name', sortClass), '-id']);

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc, `id` desc');
  });

  test('can allow multiple sort parameters', ({ assert }) => {
    const query = createQueryFromSortRequest('name').allowedSorts('id', 'name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
  });

  test('can allow multiple sort parameters as an array', ({ assert }) => {
    const query = createQueryFromSortRequest('name').allowedSorts(['name', 'id']);

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
  });

  test('can sort by multiple columns', async ({ assert }) => {
    const db = await app.container.make('lucid.db');
    await setupDatabase(db);
    await TestModelFactory.createMany(5);
    await TestModelFactory.merge({
      name: 'foo',
    }).createMany(3);

    const query = createQueryFromSortRequest('name,-id').allowedSorts('name', 'id');
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const expected = await TestModel.query().orderBy('name').orderBy('id', 'desc').exec();
    const expectedCollection = new Collection(expected);

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc, `id` desc');
    assert.deepEqual(expectedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('can sort by a custom sort class', ({ assert }) => {
    const sortClass = new CustomSort();
    const query = createQueryFromSortRequest('custom_name').allowedSorts(AllowedSort.custom('custom_name', sortClass));

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` asc');
  });

  test('can take an argument for custom column name resolution', ({ assert }) => {
    /** @ts-expect-error: ignore for testing purposes */
    const sort = AllowedSort.custom('property_name', new SortsField(), 'property_column_name');

    assert.instanceOf(sort, AllowedSort);
    assert.properties(sort, ['internalName']);
  });

  test('sets property column name to property name by default', ({ assert }) => {
    const sort = AllowedSort.custom('property_name', new SortsField());

    assert.equal(sort.getInternalName(), sort.getName());
  });

  test('resolves queries using property column name', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const testModel = await TestModelFactory.merge({ name: 'zzzzzz' }).create();
    await testModel.refresh();
    const sort = AllowedSort.custom<typeof TestModel>('nickname', new SortsField(), 'name');

    const query = createQueryFromSortRequest('nickname').allowedSorts(sort);
    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
    assert.deepEqual(testModel.serialize(), originalCollection.last().serialize());
  });

  test('can sort descending with an alias', ({ assert }) => {
    const query = createQueryFromSortRequest('-exposedPropertyName').allowedSorts(
      AllowedSort.field('exposedPropertyName', 'name'),
    );

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` desc');
  });

  test('given a default sort a sort alias will still be resolved', ({ assert }) => {
    const query = createQueryFromSortRequest('-joined')
      .defaultSort('name')
      .allowedSorts(AllowedSort.field('joined', 'createdAt'));

    assert.equal(query.toQuery(), 'select * from `test_models` order by `created_at` desc');
  });

  test('can sort and use scoped filters at the same time', async ({ assert }) => {
    await createDbModels(app, TestModelFactory, 5);
    const sortClass = new CustomSort();
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        name: 'foo',
        between: '2016-01-01,2017-01-01',
      },
      sort: '-custom',
    });
    const query = TestModel.query()
      .withRequest(request)
      .allowedFilters(
        AllowedFilter.callback('name', (subQuery, value) => {
          void subQuery.withScopes((scope) => scope.namedScope(value as string));
        }),
        AllowedFilter.callback('between', (subQuery, value) => {
          const requestValue = value as [string, string];
          void subQuery.withScopes((scope) => scope.createdBetweenScope(requestValue[0], requestValue[1]));
        }),
      )
      .allowedSorts(AllowedSort.custom('custom', sortClass));

    const result = await query.exec();
    const originalCollection = new Collection(result);
    const sortedCollection = originalCollection.sortBy('name');

    const from = DateTime.fromISO('2016-01-01').toSQL()!;
    const to = DateTime.fromISO('2017-01-01').toSQL()!;

    assert.equal(
      query.toQuery(),
      [
        "select * from `test_models` where `name` = 'foo' and `created_at` between '",
        from,
        "' and '",
        to,
        "' order by `name` desc",
      ].join(''),
    );
    assert.deepEqual(sortedCollection.pluck('id').all(), originalCollection.pluck('id').all());
  });

  test('ignores non existing sorts before adding them as an alias', ({ assert }) => {
    const query = createQueryFromSortRequest('-alias');

    assert.equal(query.toQuery(), 'select * from `test_models`');

    void query.allowedSorts(AllowedSort.field('alias', 'name'));

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` desc');
  });

  test('raw sorts do not get purged when specifying allowed sorts', ({ assert }) => {
    const query = createQueryFromSortRequest('-name').orderByRaw('RANDOM()').allowedSorts('name');

    assert.equal(query.toQuery(), 'select * from `test_models` order by RANDOM(), `name` desc');
  });

  test('the default direction of an allow sort can be set', ({ assert }) => {
    const sortClass = new CustomSort();
    const query = createQueryFromSortRequest()
      .allowedSorts(AllowedSort.custom('custom_name', sortClass))
      .defaultSort(AllowedSort.custom('custom_name', sortClass).setDefaultDirection(SortDirection.Descending));

    assert.equal(query.toQuery(), 'select * from `test_models` order by `name` desc');
  });
});
