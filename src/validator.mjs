import Ajv from "ajv";
import {
  stripQueryFromUrl,
  getRouteKeyAndParams,
  getPathSchema,
  getQuerySchema,
  getBodySchema,
  formatErrorMessage,
  formatErrors,
} from "./validator.util.mjs";

export const validateRequest = (schema, req, next, options = {}) => {
  const { url, query } = stripQueryFromUrl(req.originalUrl);
  const method = req.method;
  const routes = Object.keys(schema.paths || {});
  const { routeKey, params } = getRouteKeyAndParams(url, method, routes);

  const validate = (schemaGetter, paramsToValidate) => {
    const schemaForValidation = {
      properties: schemaGetter(schema, routeKey, method),
    };
    const ajv = new Ajv(options);
    const validator = ajv.compile(schemaForValidation);
    return {
      isValid: validator(paramsToValidate),
      errors: validator.errors,
    };
  };

  const formatErrorsAndReturn = (err, propName, msgPrefix) => {
    const errors = err.map((e) => formatErrors(routeKey, method, propName, e));
    next({
      status: 400,
      toString: () => formatErrorMessage(msgPrefix, errors),
    });
    return {
      errors,
      pathParams: params,
      bodyParams: req.body,
      queryParams: query,
    };
  };

  // Validate path parameters
  if (typeof params === "object" && Object.keys(params).length) {
    const { isValid, errors } = validate(getPathSchema, params);
    const msgPrefix = "Persnickety[Path params validation failed]:";

    if (!isValid) {
      return formatErrorsAndReturn(errors, "parameters", msgPrefix);
    }
  }

  // Validate query parameters
  if (typeof query === "object" && Object.keys(query).length) {
    const { isValid, errors } = validate(getQuerySchema, query);
    const msgPrefix = "Persnickety[Query params validation failed]:";

    if (!isValid) {
      return formatErrorsAndReturn(errors, "parameters", msgPrefix);
    }
  }

  // Validate body parameters
  const path = schema.paths && schema.paths[routeKey];
  const routeBody = path && path[method.toLowerCase()].requestBody;

  if (typeof routeBody === "object") {
    const msgPrefix = "Persnickety[Body params validation failed]:";

    if (routeBody.required && Object.keys(req.body).length < 1) {
      next(`${msgPrefix} body is required`);
      return {
        errors: [],
        pathParams: params,
        bodyParams: req.body,
        queryParams: query,
      };
    }

    if (Object.keys(req.body).length) {
      const { isValid, errors } = validate(getBodySchema, req.body);

      if (!isValid) {
        return formatErrorsAndReturn(errors, "requestBody", msgPrefix);
      }
    }
  }

  next();
};
