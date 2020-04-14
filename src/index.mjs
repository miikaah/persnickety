let schema;

const Persnickety = (schemaSkeleton) => {
  schema = schemaSkeleton;

  return {
    getSchema: () => schema,
  };
};

export const Route = (path) => {
  schema = {
    ...schema,
    paths: {
      ...schema.paths,
      ...path,
    },
  };
};

export const Model = (model) => {
  schema = {
    ...schema,
    components: {
      schemas: {
        ...(schema.components && schema.components.schemas),
        ...model,
      },
    },
  };
};

export default Persnickety;
