import factory from '@adonisjs/lucid/factories';
import { unique } from '@dpaskhin/unique';
import TestModel from '../models/test_model.js';

export const TestModelFactory = factory
  .define(TestModel, ({ faker }) => {
    return {
      name: unique(faker.person.firstName()),
      fullName: faker.person.fullName(),
    };
  })
  .build();
