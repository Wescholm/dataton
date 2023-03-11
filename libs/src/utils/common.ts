export const getKeyByValue = (object: Object, value: any): string => {
  for (const key in object) {
    if (object[key] === value) {
      return key;
    }
  }
  return null;
}