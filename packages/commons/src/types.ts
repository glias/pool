export type Maybe<T> = T | undefined | null;

export type Just<T> = T extends Maybe<infer X> ? X : T;
