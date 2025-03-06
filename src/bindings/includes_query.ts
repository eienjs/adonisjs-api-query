import { type ModelQueryBuilder } from '@adonisjs/lucid/orm';
import { type LucidModel } from '@adonisjs/lucid/types/model';
import { Collection } from 'collect.js';
import { AllowedInclude } from '../allowed_include.js';
import { InvalidIncludeQuery } from '../exceptions/invalid_include_query.js';
import { type ResolvedApiQueryConfig } from '../types.js';

type ModelQueryBuilderWithAllowedIncludes = ModelQueryBuilder & {
  _allowedIncludes: Collection<AllowedInclude<LucidModel>>;
};

export const extendModelQueryBuilderWithIncludesQuery = function (
  builder: typeof ModelQueryBuilder,
  config: ResolvedApiQueryConfig,
): void {
  const ensureAllIncludesExist = (self: ModelQueryBuilderWithAllowedIncludes): void => {
    if (config.disableInvalidIncludesQueryException) {
      return;
    }

    const includes = self.getRequest().includes();
    const allowedIncludeNames = self._allowedIncludes.map((allowedInclude) => {
      return allowedInclude.getName();
    });

    const diff = includes.diff(allowedIncludeNames);

    if (diff.isNotEmpty()) {
      throw InvalidIncludeQuery.includesNotAllowed(diff.all(), allowedIncludeNames.all());
    }
  };

  const findInclude = (
    self: ModelQueryBuilderWithAllowedIncludes,
    include: string,
  ): AllowedInclude<LucidModel> | undefined => {
    return self._allowedIncludes.first((included) => included.isForInclude(include));
  };

  const filterNonExistingIncludes = (self: ModelQueryBuilderWithAllowedIncludes) => {
    const includes = self.getRequest().includes();

    if (!config.disableInvalidIncludesQueryException) {
      return includes;
    }

    return includes.filter((include) => !findInclude(self, include));
  };

  const addIncludesToQuery = (self: ModelQueryBuilderWithAllowedIncludes, includes: Collection<string>) => {
    includes.each((include) => {
      const allowedInclude = findInclude(self, include);
      allowedInclude?.include(self);
    });
  };

  builder.macro('allowedIncludes', function (this: ModelQueryBuilderWithAllowedIncludes, ...includes) {
    const arrayIncludes = Array.isArray(includes.at(0))
      ? includes.at(0)
      : (includes as (AllowedInclude<LucidModel> | string)[]);

    this._allowedIncludes = (
      new Collection(arrayIncludes)
        .reject((include) => typeof include === 'string' && include.length === 0)
        .reduce<Collection<AllowedInclude<LucidModel>>>((result, include) => {
          if (include instanceof AllowedInclude) {
            return result!.push(include);
          }

          if (include.endsWith(config.countSuffix)) {
            for (const allowedInclude of AllowedInclude.count(include)) {
              result = result!.push(allowedInclude);
            }

            return result!;
          }

          for (const allowedInclude of AllowedInclude.relationship(include)) {
            result = result!.push(allowedInclude);
          }

          return result!;
        }, new Collection()) as Collection<AllowedInclude<LucidModel>>
    ).unique((allowedInclude: AllowedInclude<LucidModel>) => {
      return allowedInclude.getName();
    });

    ensureAllIncludesExist(this);

    const resultIncludes = filterNonExistingIncludes(this);
    addIncludesToQuery(this, resultIncludes);

    return this;
  });
};
