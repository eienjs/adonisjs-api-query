import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';
import type { DateTime } from 'luxon';
import { compose } from '@adonisjs/core/helpers';
import { BaseModel, column, scope } from '@adonisjs/lucid/orm';
import { SoftDeletes } from '@codenameryuu/adonis-lucid-soft-deletes';

type Builder = ModelQueryBuilderContract<typeof SoftDeleteModel> & {
  onlyTrashed: () => ModelQueryBuilderContract<typeof SoftDeleteModel>;
};

export default class SoftDeleteModel extends compose(BaseModel, SoftDeletes) {
  public static readonly onlyTrashedScope = scope((scopeQuery) => {
    const query = scopeQuery as Builder;

    void query.onlyTrashed();
  });

  @column({ isPrimary: true })
  declare public id: number;

  @column()
  declare public name: string;

  @column.dateTime()
  declare public deletedAt: DateTime | null;
}
