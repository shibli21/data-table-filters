// TODO: check if we can move to /data-table-filter-command/utils.ts
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { DataTableFilterField } from "./types";
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
} from "@/lib/delimiters";
import type { Parser } from "nuqs";

export function deserialize<T extends Record<string, Parser<any>>>(schema: T) {
  return (value: string) => {
    try {
      const parsed = value
        .trim()
        .split(" ")
        .reduce((prev, curr) => {
          const [name, value] = curr.split(":");
          if (!value || !name || !(name in schema)) return prev;
          // Use the parse method from the nuqs Parser
          const parsedValue = schema[name].parse(value);
          // Nuqs parsers return the parsed value or null for invalid inputs
          if (parsedValue !== null) {
            prev[name] = parsedValue;
          }
          return prev;
        }, {} as Record<string, any>);

      return { success: true, data: parsed };
    } catch (error) {
      return { success: false, error };
    }
  };
}

// export function serialize<T extends z.AnyZodObject>(schema: T) {
//   return (value: z.infer<T>) =>
//     schema
//       .transform((val) => {
//         Object.keys(val).reduce((prev, curr) => {
//           if (Array.isArray(val[curr])) {
//             return `${prev}${curr}:${val[curr].join(",")} `;
//           }
//           return `${prev}${curr}:${val[curr]} `;
//         }, "");
//       })
//       .safeParse(value);
// }

export function serializeColumFilters<TData>(
  columnFilters: ColumnFiltersState,
  filterFields?: DataTableFilterField<TData>[]
) {
  return columnFilters.reduce((prev, curr) => {
    const { type, commandDisabled } = filterFields?.find(
      (field) => curr.id === field.value
    ) || { commandDisabled: true }; // if column filter is not found, disable the command by default

    if (commandDisabled) return prev;

    if (Array.isArray(curr.value)) {
      if (type === "slider") {
        return `${prev}${curr.id}:${curr.value.join(SLIDER_DELIMITER)} `;
      }
      if (type === "checkbox") {
        return `${prev}${curr.id}:${curr.value.join(ARRAY_DELIMITER)} `;
      }
      if (type === "timerange") {
        return `${prev}${curr.id}:${curr.value.join(RANGE_DELIMITER)} `;
      }
    }

    return `${prev}${curr.id}:${curr.value} `;
  }, "");
}
