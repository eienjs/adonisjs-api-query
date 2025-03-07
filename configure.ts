import type Configure from '@adonisjs/core/commands/configure';

export const configure = async (command: Configure): Promise<void> => {
  const codemods = await command.createCodemods();

  // await codemods.updateRcFile((rcFile) => {
  //   rcFile
  // });
};
