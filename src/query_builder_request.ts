import { HttpContext, type Request } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import { Collection } from 'collect.js';
import { type ResolvedApiQueryConfig } from './types.js';
import { strAfterLast, strBeforeLast } from './utils/helpers.js';

export class QueryBuilderRequest {
  protected static includesArrayValueDelimiter = ',';

  protected static appendsArrayValueDelimiter = ',';

  protected static fieldsArrayValueDelimiter = ',';

  protected static sortsArrayValueDelimiter = ',';

  protected static filterArrayValueDelimiter = ',';

  public static setArrayValueDelimiter(delimiter: string): void {
    this.includesArrayValueDelimiter = delimiter;
    this.appendsArrayValueDelimiter = delimiter;
    this.fieldsArrayValueDelimiter = delimiter;
    this.sortsArrayValueDelimiter = delimiter;
    this.filterArrayValueDelimiter = delimiter;
  }

  public static setIncludesArrayValueDelimiter(includesArrayValueDelimiter: string): void {
    QueryBuilderRequest.includesArrayValueDelimiter = includesArrayValueDelimiter;
  }

  public static setAppendsArrayValueDelimiter(appendsArrayValueDelimiter: string): void {
    QueryBuilderRequest.appendsArrayValueDelimiter = appendsArrayValueDelimiter;
  }

  public static setFieldsArrayValueDelimiter(fieldsArrayValueDelimiter: string): void {
    QueryBuilderRequest.fieldsArrayValueDelimiter = fieldsArrayValueDelimiter;
  }

  public static setSortsArrayValueDelimiter(sortsArrayValueDelimiter: string): void {
    QueryBuilderRequest.sortsArrayValueDelimiter = sortsArrayValueDelimiter;
  }

  public static setFilterArrayValueDelimiter(filterArrayValueDelimiter: string): void {
    QueryBuilderRequest.filterArrayValueDelimiter = filterArrayValueDelimiter;
  }

  public static getIncludesArrayValueDelimiter(): string {
    return QueryBuilderRequest.includesArrayValueDelimiter;
  }

  public static getAppendsArrayValueDelimiter(): string {
    return QueryBuilderRequest.appendsArrayValueDelimiter;
  }

  public static getFieldsArrayValueDelimiter(): string {
    return QueryBuilderRequest.fieldsArrayValueDelimiter;
  }

  public static getSortsArrayValueDelimiter(): string {
    return QueryBuilderRequest.sortsArrayValueDelimiter;
  }

  public static getFilterArrayValueDelimiter(): string {
    return QueryBuilderRequest.filterArrayValueDelimiter;
  }

  public static resetDelimiters(): void {
    QueryBuilderRequest.includesArrayValueDelimiter = ',';
    QueryBuilderRequest.appendsArrayValueDelimiter = ',';
    QueryBuilderRequest.fieldsArrayValueDelimiter = ',';
    QueryBuilderRequest.sortsArrayValueDelimiter = ',';
    QueryBuilderRequest.filterArrayValueDelimiter = ',';
  }

  public static fromRequest(request: Request): QueryBuilderRequest {
    return new QueryBuilderRequest(request);
  }

  private readonly _request: Request;

  private readonly _config: ResolvedApiQueryConfig;

  public constructor(request?: Request, config?: ResolvedApiQueryConfig) {
    if (!request) {
      const ctx = HttpContext.getOrFail();
      request = ctx.request;
    }

    if (!config) {
      config = app.config.get<ResolvedApiQueryConfig>('apiquery');
    }

    this._request = request;
    this._config = config;
  }

  public includes(): Collection<unknown> {
    const includeParameterName = this._config.parameters.include;
    let includeParts = this.getRequestData(includeParameterName, {});

    if (typeof includeParts === 'string') {
      includeParts = includeParts.split(QueryBuilderRequest.getIncludesArrayValueDelimiter());
    }

    return new Collection(includeParts).filter();
  }

  public appends(): Collection<unknown> {
    const appendParameterName = this._config.parameters.append;

    let appendParts = this.getRequestData(appendParameterName, {});

    if (typeof appendParts === 'string') {
      appendParts = appendParts.split(QueryBuilderRequest.getAppendsArrayValueDelimiter());
    }

    return new Collection(appendParts).filter();
  }

  public fields(): Collection<unknown> {
    const fieldsParameterName = this._config.parameters.fields;
    const fieldsData = this.getRequestData(fieldsParameterName, {});
    const fieldsPerTable = new Collection(
      typeof fieldsData === 'string'
        ? fieldsData.split(QueryBuilderRequest.getFieldsArrayValueDelimiter())
        : fieldsData,
    );

    if (fieldsPerTable.isEmpty()) {
      return new Collection();
    }

    const fields: Record<string, unknown> = {};
    fieldsPerTable.each((tableFields, model) => {
      if (!model || typeof model === 'number') {
        model = typeof tableFields === 'string' && tableFields.includes('.') ? strBeforeLast(tableFields, '.') : '_';
      }

      if (!fields[model]) {
        fields[model] = [];
      }

      if (typeof tableFields === 'string') {
        tableFields = tableFields.split(QueryBuilderRequest.getFieldsArrayValueDelimiter()).map((field) => {
          return strAfterLast(field, '.');
        });
      }

      fields[model] = [...(fields[model] as string[]), ...(tableFields as string[])];
    });

    return new Collection(fields);
  }

  public sorts(): Collection<unknown> {
    const sortParameterName = this._config.parameters.sort;

    let sortParts = this.getRequestData(sortParameterName, {});

    if (typeof sortParts === 'string') {
      sortParts = sortParts.split(QueryBuilderRequest.getSortsArrayValueDelimiter());
    }

    return new Collection(sortParts).filter();
  }

  public filters(): Collection<unknown> {
    const filterParameterName = this._config.parameters.filter;

    const filterParts = this.getRequestData(filterParameterName, {});

    if (typeof filterParts === 'string') {
      return new Collection();
    }

    const filters = new Collection(filterParts);

    return filters.map((value) => {
      return this.getFilterValue(value);
    });
  }

  protected getFilterValue(value: unknown): unknown {
    if (
      !value ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    ) {
      return '';
    }

    if (Array.isArray(value) || typeof value === 'object') {
      return new Collection(value)
        .map((valueValue) => {
          return this.getFilterValue(valueValue);
        })
        .all();
    }

    if (typeof value === 'string' && value.includes(QueryBuilderRequest.getFilterArrayValueDelimiter())) {
      return value.split(QueryBuilderRequest.getFilterArrayValueDelimiter());
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  }

  protected getRequestData<T = unknown>(key: string, defaultValue?: T): T {
    return this._request.input(key, defaultValue) as T;
  }
}
