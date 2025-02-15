import { HttpContext, type Request } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import { Collection } from 'collect.js';
import { strAfterLast, strBeforeLast } from './utils/helpers.js';

export class ApiQueryBuilderRequest {
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
    this.includesArrayValueDelimiter = includesArrayValueDelimiter;
  }

  public static setAppendsArrayValueDelimiter(appendsArrayValueDelimiter: string): void {
    this.appendsArrayValueDelimiter = appendsArrayValueDelimiter;
  }

  public static setFieldsArrayValueDelimiter(fieldsArrayValueDelimiter: string): void {
    this.fieldsArrayValueDelimiter = fieldsArrayValueDelimiter;
  }

  public static setSortsArrayValueDelimiter(sortsArrayValueDelimiter: string): void {
    this.sortsArrayValueDelimiter = sortsArrayValueDelimiter;
  }

  public static setFilterArrayValueDelimiter(filterArrayValueDelimiter: string): void {
    this.filterArrayValueDelimiter = filterArrayValueDelimiter;
  }

  public static getIncludesArrayValueDelimiter(): string {
    return this.includesArrayValueDelimiter;
  }

  public static getAppendsArrayValueDelimiter(): string {
    return this.appendsArrayValueDelimiter;
  }

  public static getFieldsArrayValueDelimiter(): string {
    return this.fieldsArrayValueDelimiter;
  }

  public static getSortsArrayValueDelimiter(): string {
    return this.sortsArrayValueDelimiter;
  }

  public static getFilterArrayValueDelimiter(): string {
    return this.filterArrayValueDelimiter;
  }

  public static resetDelimiters(): void {
    this.includesArrayValueDelimiter = ',';
    this.appendsArrayValueDelimiter = ',';
    this.fieldsArrayValueDelimiter = ',';
    this.sortsArrayValueDelimiter = ',';
    this.filterArrayValueDelimiter = ',';
  }

  public static fromRequest(request: Request): ApiQueryBuilderRequest {
    return new ApiQueryBuilderRequest(request);
  }

  private readonly _request: Request;

  public constructor(request?: Request) {
    if (!request) {
      const ctx = HttpContext.getOrFail();
      request = ctx.request;
    }

    this._request = request;
  }

  public includes(): Collection<unknown> {
    const includeParameterName = app.config.get<string>('apiquery.parameters.include', 'include');
    let includeParts = this.getRequestData(includeParameterName, {});

    if (typeof includeParts === 'string') {
      includeParts = includeParts.split(ApiQueryBuilderRequest.getIncludesArrayValueDelimiter());
    }

    return new Collection(includeParts).filter();
  }

  public appends(): Collection<unknown> {
    const appendParameterName = app.config.get<string>('apiquery.parameters.append', 'append');

    let appendParts = this.getRequestData(appendParameterName, {});

    if (typeof appendParts === 'string') {
      appendParts = appendParts.split(ApiQueryBuilderRequest.getAppendsArrayValueDelimiter());
    }

    return new Collection(appendParts).filter();
  }

  public fields(): Collection<unknown> {
    const fieldsParameterName = app.config.get<string>('apiquery.parameters.fields', 'fields');
    const fieldsData = this.getRequestData(fieldsParameterName, {});
    const fieldsPerTable = new Collection(
      typeof fieldsData === 'string'
        ? fieldsData.split(ApiQueryBuilderRequest.getFieldsArrayValueDelimiter())
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
        tableFields = tableFields.split(ApiQueryBuilderRequest.getFieldsArrayValueDelimiter()).map((field) => {
          return strAfterLast(field, '.');
        });
      }

      fields[model] = [...(fields[model] as string[]), ...(tableFields as string[])];
    });

    return new Collection(fields);
  }

  public sorts(): Collection<string> {
    const sortParameterName = app.config.get<string>('apiquery.parameters.sort', 'sort');

    let sortParts = this.getRequestData(sortParameterName, {});

    if (typeof sortParts === 'string') {
      sortParts = sortParts.split(ApiQueryBuilderRequest.getSortsArrayValueDelimiter());
    }

    return new Collection<string>(sortParts).filter();
  }

  public filters(): Collection<unknown> {
    const filterParameterName = app.config.get<string>('apiquery.parameters.filter', 'filter');

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

    if (typeof value === 'string' && value.includes(ApiQueryBuilderRequest.getFilterArrayValueDelimiter())) {
      return value.split(ApiQueryBuilderRequest.getFilterArrayValueDelimiter());
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
