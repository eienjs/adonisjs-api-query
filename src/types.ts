import { type LucidModel, type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';

export interface ApiQueryConfigParameters {
  include?: string;
  filter?: string;
  sort?: string;
  fields?: string;
  append?: string;
}

export interface ApiQueryConfig {
  /**
   * By default the package will use the `include`, `filter`, `sort`
   * and `fields` query parameters as described in the readme.
   *
   * You can customize these query string parameters here.
   */
  parameters?: ApiQueryConfigParameters;

  /**
   * Related model counts are included using the relationship name suffixed with this string.
   * For example: GET /users?include=postsCount
   */
  countSuffix?: string;

  /**
   * Related model exists are included using the relationship name suffixed with this string.
   * For example: GET /users?include=postsExists
   */
  existsSuffix?: string;

  /**
   * By default the package will throw an `InvalidFilterQuery` exception when a filter in the
   * URL is not allowed in the `allowedFilters()` method.
   */
  disableInvalidFilterQueryException?: boolean;

  /**
   * By default the package will throw an `InvalidSortQuery` exception when a sort in the
   * URL is not allowed in the `allowedSorts()` method.
   */
  disableInvalidSortQueryException?: boolean;

  /**
   * By default the package will throw an `InvalidIncludeQuery` exception when an include in the
   * URL is not allowed in the `allowedIncludes()` method.
   */
  disableInvalidIncludesQueryException?: boolean;

  /**
   * By default, the package expects relationship names to be camel case plural when using fields[relationship].
   * For example, fetching the id and name for a userOwner relation would look like this:
   * GET /users?fields[userOwner]=id,name
   *
   * Set this to `true` if you don't want that and keep the requested relationship names as-is and allows you to
   * request the fields using a snake case relationship name:
   * GET /users?fields[user_owner]=id,name
   */
  convertRelationNamesToSnakeCasePlural?: boolean;

  /**
   * By default, the package expects relationship names to be camel case plural when using fields[relationship].
   * For example, fetching the id and name for a userOwner relation would look like this:
   * GET /users?fields[userOwner]=id,name
   *
   * Set this to one of `snake_case`, `camelCase` or `none` if you want to enable table name resolution in addition to the relation name resolution
   * GET /users?include=top_orders&fields[orders]=id,name
   */
  convertRelationTableNameStrategy?: 'snake_case' | 'camelCase' | 'none' | false;

  /**
   * By default, the package expects the field names to match the database names
   * For example, fetching the field named firstName would look like this:
   * GET /users?fields=firstName
   *
   * Set this to `true` if you want to convert the firstName into first_name for the underlying query
   */
  convertFieldNamesToSnakeCase?: boolean;
}

export type ResolvedApiQueryConfig = Required<ApiQueryConfig> & { parameters: Required<ApiQueryConfigParameters> };

export interface Sort {
  handle<Model extends LucidModel, Result = InstanceType<Model>>(
    query: ModelQueryBuilderContract<Model, Result>,
    descending: boolean,
    property: string,
  ): void;
}
