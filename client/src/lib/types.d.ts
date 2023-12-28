
type RecordOf<T> = Record<string, T>;
type PartialPlus<T> = Partial<T> & RecordOf<any>;
