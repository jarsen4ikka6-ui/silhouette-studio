// require.context — функция сборщика (webpack), которой собирается Remotion
declare namespace NodeJS {
  interface Require {
    context(dir: string, deep: boolean, filter: RegExp): { keys(): string[]; <T>(key: string): T };
  }
}
