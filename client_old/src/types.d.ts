type RecordOf<T> = Record<string, T>;
type PartialPlus<T> = Partial<T> & RecordOf<any>;
type NonEmptyArray<T> = [T, ...T[]];
type TempInit<T> = T & { init?: () => void };
