export const substrReplace = (str: string, replace: string, start: number, length?: number): string => {
  if (start < 0) {
    start += str.length;
  }

  length = length ?? str.length;
  if (length < 0) {
    length = length + str.length - start;
  }

  return [
    str.slice(0, start),
    replace.slice(0, Math.max(0, length)),
    replace.slice(length),
    str.slice(start + length),
  ].join('');
};

export const strBeforeLast = (subject: string, search: string): string => {
  if (search === '') {
    return subject;
  }

  const pos = subject.lastIndexOf(search);

  if (pos === -1) {
    return subject;
  }

  return subject.slice(0, Math.max(0, pos));
};

export const strAfterLast = (subject: string, search: string): string => {
  if (search === '') {
    return subject;
  }

  const pos = subject.lastIndexOf(search);

  if (pos === -1) {
    return subject;
  }

  return subject.slice(pos + search.length);
};
