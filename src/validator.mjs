import Ajv from "ajv";
import {
  stripQueryFromUrl,
  getRouteKeyAndParams,
  getPathParams,
  getQueryParams,
  getBodyParams,
  formatErrorMessage,
  formatErrors,
} from "./validator.util.mjs";

export const validateRequest = (schema, req, next, options = {}) => {
  const { url, query } = stripQueryFromUrl(req.originalUrl);
  const method = req.method;
  const routes = Object.keys(schema.paths);
  const { routeKey, params } = getRouteKeyAndParams(url, method, routes);

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
    const pathSchema = {
      properties: getPathParams(schema, routeKey, method),
    };
    const ajv = new Ajv(options);
    const pathParamsValidator = ajv.compile(pathSchema);
    const isValid = pathParamsValidator(params);

    if (!isValid) {
      return formatErrorsAndReturn(
        pathParamsValidator.errors,
        "parameters",
        "Persnickety[Path params validation failed]:"
      );
    }
  }

  // Validate query parameters
  if (typeof query === "object" && Object.keys(query).length) {
    const querySchema = {
      properties: getQueryParams(schema, routeKey, method),
    };
    const ajv = new Ajv(options);
    const queryParamsValidator = ajv.compile(querySchema);
    const isValid = queryParamsValidator(query);

    if (!isValid) {
      return formatErrorsAndReturn(
        queryParamsValidator.errors,
        "parameters",
        "Persnickety[Query params validation failed]:"
      );
    }
  }

  // Validate body parameters
  const routeBody = schema.paths[routeKey][method.toLowerCase()].requestBody;

  if (typeof routeBody === "object") {
    const bodyErrMsgPrefix = "Persnickety[Body params validation failed]:";

    if (routeBody.required && Object.keys(req.body).length < 1) {
      next(`${bodyErrMsgPrefix} body is required`);
      return {
        errors: [],
        pathParams: params,
        bodyParams: req.body,
        queryParams: query,
      };
    }

    if (Object.keys(req.body).length) {
      const bodySchema = {
        properties: getBodyParams(schema, routeKey, method),
      };
      const ajv = new Ajv(options);
      const bodyParamsValidator = ajv.compile(bodySchema);
      const isValid = bodyParamsValidator(req.body);

      if (!isValid) {
        return formatErrorsAndReturn(
          bodyParamsValidator.errors,
          "requestBody",
          bodyErrMsgPrefix
        );
      }
    }
  }

  next();
};
