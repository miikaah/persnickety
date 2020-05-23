import { validateRequest } from "./validator.mjs";

let schema;
let whitelist;
let startsWithWhitelist;

const Persnickety = (schemaSkeleton, requestWhitelist) => {
  schema = schemaSkeleton;
  whitelist = requestWhitelist;
  startsWithWhitelist = requestWhitelist
    .filter(route => route.endsWith('/*'))
    .map(route => route.replace('/*', ''));

  return {
    getSchema: () => schema,
    requestValidator: (options) => (req, res, next) => {
      const url = req.originalUrl
      if (whitelist) {
        if (whitelist.includes(url)) {
          next();
          return;
        }
        if (startsWithWhitelist.some(route => url.startsWith(route))) {
          next();
          return;
        }
      }
      options.callback(
        req,
        validateRequest(schema, req, next, options.ajvOptions)
      );
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
