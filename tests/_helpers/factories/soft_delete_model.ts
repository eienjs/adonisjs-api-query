import factory from '@adonisjs/lucid/factories';
import { unique } from '@dpaskhin/unique';
import SoftDeleteModel from '../models/soft_delete_model.js';

export const SoftDeleteModelFactory = factory
  .define(SoftDeleteModel, ({ faker }) => {
    return {
      name: unique(faker.person.firstName()),
    };
  })
  .build();
