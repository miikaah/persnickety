import { validateRequest } from "./validator.mjs";

let schema;

const Persnickety = (schemaSkeleton) => {
  schema = schemaSkeleton;

  return {
    getSchema: () => schema,
    requestValidator: (options) => (req, res, next) => {
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
