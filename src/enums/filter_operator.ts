export const FilterOperator = {
  Dynamic: '',
  Equal: '=',
  LessThan: '<',
  GreaterThan: '>',
  LessThanOrEqual: '<=',
  GreaterThanOrEqual: '>=',
  NotEqual: '<>',
} as const;

export type FilterOperator = (typeof FilterOperator)[keyof typeof FilterOperator];
