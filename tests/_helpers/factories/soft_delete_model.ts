import factory from '@adonisjs/lucid/factories';
import { UniqueEnforcer } from 'enforce-unique';
import SoftDeleteModel from '../models/soft_delete_model.js';

const uniqueEnforcerName = new UniqueEnforcer();

export const SoftDeleteModelFactory = factory
  .define(SoftDeleteModel, ({ faker }) => {
    return {
      name: uniqueEnforcerName.enforce(() => {
        return faker.person.firstName();
      }),
    };
  })
  .build();
