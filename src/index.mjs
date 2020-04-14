let schema;

const Persnickety = (schemaSkeleton) => {
  schema = schemaSkeleton;

  return {
    getSchema: () => schema,
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
