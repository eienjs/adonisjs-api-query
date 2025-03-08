import type Configure from '@adonisjs/core/commands/configure';
import { stubsRoot } from './stubs/main.js';

export const configure = async (command: Configure): Promise<void> => {
  const codemods = await command.createCodemods();

  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@eienjs/adonisjs-api-query/api_query_provider');
  });

  await codemods.makeUsingStub(stubsRoot, 'config.stub', {});
};
