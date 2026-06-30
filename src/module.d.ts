declare module 'collect.js' {
  interface Collection<Item> {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    filter(isFn?: (item: Item, key?: unknown) => boolean): Collection<Item>;
  }
}
