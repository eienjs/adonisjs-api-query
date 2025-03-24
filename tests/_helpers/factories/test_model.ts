import factory from '@adonisjs/lucid/factories';
import { UniqueEnforcer } from 'enforce-unique';
import TestModel from '../models/test_model.js';

const uniqueEnforcerName = new UniqueEnforcer();

export const TestModelFactory = factory
  .define(TestModel, ({ faker }) => {
    return {
      name: uniqueEnforcerName.enforce(() => {
        return faker.person.firstName();
      }),
      fullName: faker.person.fullName(),
    };
  })
  .build();
