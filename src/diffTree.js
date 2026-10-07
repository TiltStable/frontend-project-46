const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSameValue = (a, b) => a === b || (Number.isNaN(a) && Number.isNaN(b));

const buildDiff = (data1, data2, seen = new WeakSet()) =>
  Object.keys({ ...data1, ...data2 })
    .sort()
    .flatMap((key) => {
      if (!Object.hasOwn(data2, key)) return [{ key, type: "removed", value: data1[key] }];
      if (!Object.hasOwn(data1, key)) return [{ key, type: "added", value: data2[key] }];
      if (isPlainObject(data1[key]) && isPlainObject(data2[key])) {
        if (seen.has(data1[key]) || seen.has(data2[key])) {
          throw new Error("Circular reference detected in the compared data");
        }
        seen.add(data1[key]);
        seen.add(data2[key]);
        const children = buildDiff(data1[key], data2[key], seen);
        seen.delete(data1[key]);
        seen.delete(data2[key]);
        return [{ key, type: "nested", children }];
      }
      if (isSameValue(data1[key], data2[key])) {
        return [{ key, type: "unchanged", value: data1[key] }];
      }
      return [{ key, type: "changed", oldValue: data1[key], newValue: data2[key] }];
    });

export default buildDiff;
export { isPlainObject };
