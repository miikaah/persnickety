import { validateRequest } from "./validator";
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
  RequestValidatorOptions,
  SchemaSkeleton,
} from "./types";

let schema: SchemaSkeleton;
let whitelist: string[];
let startsWithWhitelist: string[];

const defaultAjvOptions = {
  path: {
    coerceTypes: true,
  },
  query: {
    coerceTypes: true,
  },
  body: {
    coerceTypes: false,
  },
  callback: undefined,
};

const Persnickety = (schemaSkeleton: SchemaSkeleton, requestWhitelist: string[] = []) => {
  if (typeof schemaSkeleton !== "object" || Array.isArray(schemaSkeleton)) {
    throw new Error("Persnickety configuration error: schema is a required object");
  }

  schema = schemaSkeleton;
  whitelist = requestWhitelist;
  startsWithWhitelist = requestWhitelist
    .filter((route) => route.endsWith("/*"))
    .map((route) => route.replace("/*", ""));

  return {
    getSchema: () => schema,
    requestValidator:
      (options: RequestValidatorOptions = defaultAjvOptions) =>
      (req: ExpressRequest, _res: ExpressResponse, next: ExpressNextFunction) => {
        if (typeof options.callback !== "function") {
          throw new Error(
            "Persnickety configuration error: Request validator callback is not a function",
          );
        }
        const url = req.originalUrl;
        if (whitelist) {
          if (whitelist.includes(url)) {
            next();
            return;
          }
          if (startsWithWhitelist.some((route) => url.startsWith(route))) {
            next();
            return;
          }
        }
        const ajvOptions = {
          path: {
            ...defaultAjvOptions.path,
            ...options.path,
          },
          query: {
            ...defaultAjvOptions.query,
            ...options.query,
          },
          body: {
            ...defaultAjvOptions.body,
            ...options.body,
          },
        };
        options.callback(req, validateRequest(schema, req, next, ajvOptions));
      },
  };
};

export const Route = (path: string, pathSchema: Record<string, unknown>) => {
  schema = {
    ...schema,
    paths: {
      ...schema.paths,
      [path]: {
        ...(schema.paths && schema.paths[path]),
        ...pathSchema,
      },
    } as SchemaSkeleton["paths"],
  };
};

export const Model = (model: Record<string, unknown>) => {
  schema = {
    ...schema,
    components: {
      ...(schema.components && schema.components),
      schemas: {
        ...(schema.components && schema.components.schemas),
        ...model,
      },
    },
  };
};

export default Persnickety;
