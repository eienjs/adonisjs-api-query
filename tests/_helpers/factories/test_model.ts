import factory from '@adonisjs/lucid/factories';
import TestModel from '../models/test_model.js';

export const TestModelFactory = factory
  .define(TestModel, ({ faker }) => {
    return {
      name: faker.person.firstName(),
    };
  })
  .build();
