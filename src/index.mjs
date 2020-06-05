import { validateRequest } from "./validator.mjs";

let schema;
let whitelist;
let startsWithWhitelist;

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
};

const Persnickety = (schemaSkeleton, requestWhitelist) => {
  schema = schemaSkeleton;
  whitelist = requestWhitelist;
  startsWithWhitelist =
    requestWhitelist &&
    requestWhitelist
      .filter((route) => route.endsWith("/*"))
      .map((route) => route.replace("/*", ""));

  return {
    getSchema: () => schema,
    requestValidator: (options = {}) => (req, res, next) => {
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
        ...defaultAjvOptions,
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

export const Route = (path, pathSchema) => {
  schema = {
    ...schema,
    paths: {
      ...schema.paths,
      [path]: {
        ...(schema.paths && schema.paths[path]),
        ...pathSchema,
      },
    },
  };
};

export const Model = (model) => {
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
