declare module 'collect.js' {
  interface Collection<Item> {
    filter(fn?: (item: Item, key?: unknown) => boolean): Collection<Item>;
  }
}
