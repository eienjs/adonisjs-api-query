import { RequestFactory } from '@adonisjs/core/factories/http';
import { test } from '@japa/runner';
import { AllowedInclude } from '../src/allowed_include.js';
import TestModel from './_helpers/models/test_model.js';

const createQueryFromIncludeRequest = (includes: string) => {
  const request = new RequestFactory().create();
  request.updateQs({
    include: includes,
  });

  return TestModel.query().setRequest(request);
};

test.group('include', (group) => {
  test('can include an includes callback', ({ assert }) => {
    const query = createQueryFromIncludeRequest('relatedModels').allowedIncludes(
      AllowedInclude.callback('relatedModels', (subQuery) => {}),
    );
  });
});
