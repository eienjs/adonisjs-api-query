import factory from '@adonisjs/lucid/factories';
import SoftDeleteModel from '../models/soft_delete_model.js';

export const SoftDeleteModelFactory = factory
  .define(SoftDeleteModel, ({ faker }) => {
    return {
      name: faker.person.firstName(),
    };
  })
  .build();
