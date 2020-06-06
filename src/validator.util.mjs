const getQueryAsObject = (queryString) => {
  const queryParts = queryString.split("&");
  return queryParts
    .map((param) => {
      const paramParts = param.split("=");
      return { [paramParts[0]]: paramParts[1] };
    })
    .reduce((param, acc) => ({ ...acc, ...param }));
};

export const stripQueryFromUrl = (url) => {
  if (!url.includes("?")) {
    return {
      url,
      query: {},
    };
  }
  const urlParts = url.split("?");
  return {
    url: urlParts[0],
    query: getQueryAsObject(urlParts[1]),
  };
};

export const getRouteKeyAndParams = (url, method, routes) => {
  const hasTrailingSlash = url.endsWith("/");
  const urlParts = url.split("/");
  const urlLength = urlParts.length - (hasTrailingSlash ? 1 : 0);
  const urlRoot = `${method}/${urlParts[1]}`;

  // Try for an exact match
  let routeKey = routes.find((route) => {
    const routeParts = route.split("/");
    return (
      `${method}${route}`.startsWith(urlRoot) &&
      routeParts.length === urlLength &&
      url === route
    );
  });

  // Route might have path params. Do another lookup.
  // This might return a wrong routeKey if there are route clashes.
  // This is considered a user error for now.
  if (!routeKey) {
    routeKey = routes.find((route) => {
      const routeParts = route.split("/");
      return (
        `${method}${route}`.startsWith(urlRoot) &&
        routeParts.length === urlLength &&
        routeParts.every((routePart, index) => {
          const urlPart = urlParts[index];
          return (
            urlPart === routePart || urlPart === "" || routePart.includes("{")
          );
        })
      );
    });
  }

  // Validation won't run after this
  if (!routeKey) return {};

  const paramIndexes = [];
  const paramNames = routeKey
    .split("/")
    .filter((part, index) => {
      if (part.includes("{")) {
        paramIndexes.push(index);
        return true;
      }
    })
    .map((paramName) => paramName.replace("{", "").replace("}", ""));
  const params = paramNames
    .map((name, index) => ({ [name]: urlParts[paramIndexes[index]] }))
    .reduce((param, acc) => ({ ...acc, ...param }), {});

  return { routeKey, params };
};

const resolveRef = (schema, refParts) => {
  const newSchema = schema[refParts[0]];
  const newRefParts = refParts.slice(1);

  if (newRefParts.length < 1) return newSchema;

  return resolveRef(newSchema, newRefParts);
};

export const getSchema = (schema, routeKey, method, type) => {
  if (!routeKey) return;
  const pathSchema = schema.paths[routeKey];
  if (!pathSchema) return;
  const methodSchema = pathSchema[method.toLowerCase()];

  // This can happen when route has multiple parts
  // e.g. /foo/foo
  if (!methodSchema) return;

  const params = methodSchema.parameters;

  // Return undefined if the schema has no parameters
  if (!params) return;

  const refs = params.filter((p) => Object.keys(p).includes("$ref"));

  const isValidParam = (param) => param.in === type;

  let result = params;
  if (refs.length) {
    result = [
      ...params.filter((p) => !Object.keys(p).includes("$ref")),
      ...refs.map((ref) => resolveRef(schema, ref["$ref"].split("/").slice(1))),
    ];
  }
  const toObject = (acc, param) => ({
    ...acc,
    type: "object",
    properties: {
      ...acc.properties,
      [param.name]: param.schema,
    },
    required: [...acc.required, param.required && param.name],
  });
  const builtSchema = result
    .filter(isValidParam)
    .reduce(toObject, { properties: {}, required: [] });
  builtSchema.required = builtSchema.required.filter(Boolean);
  return builtSchema;
};

export const getPathSchema = (schema, routeKey, method) => {
  return getSchema(schema, routeKey, method, "path");
};

export const getQuerySchema = (schema, routeKey, method) => {
  return getSchema(schema, routeKey, method, "query");
};

export const getBodySchema = (schema, routeKey, method) => {
  const routeBody = schema.paths[routeKey][method.toLowerCase()].requestBody;
  const bodySchema = routeBody.content["application/json"].schema;
  const isRef = Object.keys(bodySchema).includes("$ref");

  if (!isRef) return bodySchema;

  return resolveRef(schema, bodySchema["$ref"].split("/").slice(1));
};

export const formatErrorMessage = (prefix, errors) => {
  return `${prefix} ${errors
    .map((e) => `${e.dataPath.replace(".", "")} ${e.message}`)
    .join(", ")}`;
};

export const formatErrors = (routeKey, method, propName, e) => ({
  ...e,
  schemaPath: `#/paths${routeKey}/${method.toLowerCase()}/${propName}/${
    e.dataPath
  }`,
});
