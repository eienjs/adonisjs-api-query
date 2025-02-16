import { RequestFactory } from '@adonisjs/core/factories/http';
import { setApp } from '@adonisjs/core/services/app';
import { type ApplicationService } from '@adonisjs/core/types';
import { test } from '@japa/runner';
import collect from 'collect.js';
import { ApiQueryBuilderRequest } from '../src/api_query_builder_request.js';
import { setupApp } from './_helpers/test_utils.js';

test.group('query builder request', (group) => {
  let app: ApplicationService;

  group.each.setup(async () => {
    app = await setupApp();
    setApp(app);

    return () => app.terminate();
  });

  test('can filter nested records', ({ assert }) => {
    const request = new RequestFactory().create();
    const expected = {
      info: {
        foo: {
          bar: 1,
        },
      },
    };
    request.updateQs({ filter: expected });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.deepEqual(queryRequest.filters().all(), expected);
  });

  test('can get empty filters recursively', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        info: {
          foo: {
            bar: null,
          },
        },
      },
    });
    const expected = {
      info: {
        foo: {
          bar: '',
        },
      },
    };
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.deepEqual(queryRequest.filters().all(), expected);
  });

  test('will map true and false as booleans recursively', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        info: {
          foo: {
            bar: 'true',
            baz: 'false',
            bazs: '0',
          },
        },
      },
    });
    const expected = {
      info: {
        foo: {
          bar: true,
          baz: false,
          bazs: '0',
        },
      },
    };
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);
    assert.deepEqual(queryRequest.filters().all(), expected);
  });

  test('can get the sort query param from the request', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      sort: 'foobar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.deepEqual(queryRequest.sorts().all(), ['foobar']);
  });

  test('can get the sort query param from the request body', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateBody({
      sort: 'foobar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.deepEqual(queryRequest.sorts().all(), ['foobar']);
  });

  test('can get different sort query parameter name', ({ assert }) => {
    app.config.set('apiquery.parameters.sort', 'sorts');
    const request = new RequestFactory().create();
    request.updateBody({
      sorts: 'foobar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.deepEqual(queryRequest.sorts().all(), ['foobar']);
  });

  test('will return an empty collection when no sort query param is specified', ({ assert }) => {
    const request = new RequestFactory().create();
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.isTrue(queryRequest.sorts().isEmpty());
  });

  test('can get multiple sort parameters from the request', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      sort: 'foo,bar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);
    const expected = collect(['foo', 'bar']);

    assert.deepEqual(queryRequest.sorts(), expected);
  });

  test('can get the filter query params from the request', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        foo: 'bar',
        baz: 'qux',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({
      foo: 'bar',
      baz: 'qux',
    });

    assert.deepEqual(queryRequest.filters(), expected);
  });

  test('can get the filter query params from the request body', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateBody({
      filter: {
        foo: 'bar',
        baz: 'qux',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({
      foo: 'bar',
      baz: 'qux',
    });

    assert.deepEqual(queryRequest.filters(), expected);
  });

  test('can use different filter query parameter name', ({ assert }) => {
    app.config.set('apiquery.parameters.filter', 'filters');
    const request = new RequestFactory().create();
    request.updateQs({
      filters: {
        foo: 'bar',
        baz: 'qux',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({
      foo: 'bar',
      baz: 'qux',
    });

    assert.deepEqual(queryRequest.filters(), expected);
  });

  test('can get empty filters', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        foo: 'bar',
        baz: null,
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({
      foo: 'bar',
      baz: '',
    });

    assert.deepEqual(queryRequest.filters(), expected);
  });

  test('will return an empty collection when no filter query params are specified', ({ assert }) => {
    const request = new RequestFactory().create();
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.isTrue(queryRequest.filters().isEmpty());
  });

  test('will map comma separated values as arrays when given in a filter query string', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        foo: 'bar',
        baz: 'qux,lex',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({
      foo: 'bar',
      baz: ['qux', 'lex'],
    });

    assert.deepEqual(queryRequest.filters(), expected);
  });

  test('will map array in filter recursively when given in a filter query string', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        foo: 'bar,baz',
        bar: {
          foobar: 'baz,bar',
        },
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({
      foo: ['bar', 'baz'],
      bar: {
        foobar: ['baz', 'bar'],
      },
    });

    assert.deepEqual(queryRequest.filters(), expected);
  });

  test('can get the include query params from the request', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      include: 'foo,bar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect(['foo', 'bar']);

    assert.deepEqual(queryRequest.includes(), expected);
  });

  test('can get the include from the request body', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateBody({
      include: 'foo,bar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect(['foo', 'bar']);

    assert.deepEqual(queryRequest.includes(), expected);
  });

  test('can get different include query parameter name', ({ assert }) => {
    app.config.set('apiquery.parameters.include', 'includes');
    const request = new RequestFactory().create();
    request.updateBody({
      includes: 'foo,bar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect(['foo', 'bar']);

    assert.deepEqual(queryRequest.includes(), expected);
  });

  test('will return an empty collection when no include query params are specified', ({ assert }) => {
    const request = new RequestFactory().create();
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.isTrue(queryRequest.includes().isEmpty());
  });

  test('can get requested fields', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      fields: {
        table: 'name,email',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);
    const expected = collect({ table: ['name', 'email'] });

    assert.deepEqual(queryRequest.fields(), expected);
  });

  test('can get requested fields without a table name', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      fields: 'name,email,related.id,related.type',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({ _: ['name', 'email'], related: ['id', 'type'] });

    assert.deepEqual(queryRequest.fields(), expected);
  });

  test('can get nested fields', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      fields: {
        'table': 'name,email',
        'pivots': 'id,type',
        'pivots.posts': 'content',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({ 'table': ['name', 'email'], 'pivots': ['id', 'type'], 'pivots.posts': ['content'] });

    assert.deepEqual(queryRequest.fields(), expected);
  });

  test('can get nested fields from a string fields request', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      fields: 'id,name,email,pivots.id,pivots.type,pivots.posts.content',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);
    const expected = collect({ '_': ['id', 'name', 'email'], 'pivots': ['id', 'type'], 'pivots.posts': ['content'] });

    assert.deepEqual(queryRequest.fields(), expected);
  });

  test('can get requested fields from the request body', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateBody({
      fields: {
        table: 'name,email',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({ table: ['name', 'email'] });

    assert.deepEqual(queryRequest.fields(), expected);
  });

  test('can get different fields parameter name', ({ assert }) => {
    app.config.set('apiquery.parameters.fields', 'field');
    const request = new RequestFactory().create();
    request.updateQs({
      field: {
        table: 'name,email',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect({ table: ['name', 'email'] });

    assert.deepEqual(queryRequest.fields(), expected);
  });

  test('can get the append query params from the request', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateQs({
      append: 'foo,bar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect(['foo', 'bar']);

    assert.deepEqual(queryRequest.appends(), expected);
  });

  test('can get different append query parameter name', ({ assert }) => {
    app.config.set('apiquery.parameters.append', 'appendit');
    const request = new RequestFactory().create();
    request.updateQs({
      appendit: 'foo,bar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect(['foo', 'bar']);

    assert.deepEqual(queryRequest.appends(), expected);
  });

  test('will return an empty collection when no append query params are specified', ({ assert }) => {
    const request = new RequestFactory().create();
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    assert.isTrue(queryRequest.appends().isEmpty());
  });

  test('can get the append query params from the request body', ({ assert }) => {
    const request = new RequestFactory().create();
    request.updateBody({
      append: 'foo,bar',
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);

    const expected = collect(['foo', 'bar']);

    assert.deepEqual(queryRequest.appends(), expected);
  });

  test('takes custom delimiter for splitting request parameters', ({ assert, cleanup }) => {
    cleanup(() => {
      ApiQueryBuilderRequest.resetDelimiters();
    });

    const request = new RequestFactory().create();
    request.updateQs({
      filter: {
        foo: 'values, contain, commas|and are split on vertical| lines',
      },
    });
    const queryRequest = ApiQueryBuilderRequest.fromRequest(request);
    ApiQueryBuilderRequest.setArrayValueDelimiter('|');

    assert.deepEqual(queryRequest.filters().all(), {
      foo: ['values, contain, commas', 'and are split on vertical', ' lines'],
    });
  });
});
