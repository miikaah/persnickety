# Persnickety

Persnickety is an OAS3 [(Open API Spec version 3)](https://swagger.io/specification/) helper tool.

It currently contains:

- Generator functions for route and model specifications
- A Request Validator for path, query and body parameters (Express middleware)

The goal of this project is to create a set of OAS3 helper tools. The goal is not to create another opionated framework around Express or any other http framework or library.

## Demo

Checkout https://github.com/miikaah/persnickety-express-demo for an in-depth demo project to see current conventions and how everything works together.

## Configuration

```
import Persnickety from "persnickety";

const persnickety = Persnickety(schema, requestWhitelist);
```

#### schema

A "skeleton" OAS3 schema. For example:

```
{
  openapi: "3.0.0",
  info: {
    title: "Persnickety demo",
  },
  servers: [
    {
      url: "http://localhost:3001",
    },
  ],
  tags: [],
  components: {
    parameters: {},
    responses: {},
  },
};

```

#### requestWhitelist

Allows you to turn off validation for specific routes. Use `/route/*` as wildcard to turn off validation for routes starting with a path.

```
const persnickety = Persnickety(schema, ["/api-docs/*", "/docs"]);
```

## Model schema generator

The Model function takes in an OSA3 Data Model aka Schema. See: https://swagger.io/docs/specification/data-models/. Multiple Model schemas can be passed in at the same time.

```
import { Model } from "persnickety";

Model({
  Foo: {
    type: "object",
    properties: {
      id: {
        type: "string",
      },
      size: {
        type: "number",
      },
    },
  }
});
```

## Route schema generator

The Route function takes in a `routeKey` which is the exact route (use `{}` to denote a path parameter) and an OAS3 path schema. See: https://swagger.io/docs/specification/basic-structure/.

```
import { Route } from "persnickety";

Route("/product/{id}", {
  put: {
    summary: "Creates or updates a Product by id",
    tags: ["Product"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
      },
      {
        name: "randomizeSecondaryColor",
        in: "query",
        required: true,
        schema: {
          type: "boolean",
        },
      },
      {
        name: "optionalQueryParam",
        in: "query",
        schema: {
          type: "integer",
        },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ProductUpsert",
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Product was updated",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Product",
            },
          },
        },
      },
      "201": {
        description: "Product was created",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Product",
            },
          },
        },
      },
      "400": {
        $ref: "#/components/responses/400",
      },
    },
  },
});

```

## Request Validator

The request validator is an Express middleware. It uses Ajv to validate the schema https://github.com/ajv-validator/ajv.

```
app.use(
  persnickety.requestValidator(options)
);
```

It logs to console on error.

```
Persnickety[Query params validation failed]: optionalQueryParam should be integer
```

### Request validator options

All options are optional.

```
persnickety.requestValidator({
  ajvOptions: {},
  callback: (req, result) => {},
})
```

#### ajvOptions

The options are passed to Ajv during validation. There are 3 types of validation and each has its separate AjvOptions object.

```
{
  path: {},
  query: {},
  body: {},
}
```

#### callback

The callback is called after validation has been done. You can use it to handle the request further. The result contains the Ajv validation error and input parameters if there was an error.

```
{
  errors: [
    {
      keyword: 'type',
      dataPath: '.optionalQueryParam',
      schemaPath: '#/paths/product/{id}/put/parameters/.optionalQueryParam',
      params: [Object],
      message: 'should be integer'
    }
  ],
  pathParams: { id: 'asd' },
  bodyParams: { size: 'string', mainColor: 'string', secondaryColor: 0 },
  queryParams: { optionalQueryParam: 'asd', randomizeSecondaryColor: true }
}
```

### Default Ajv options

The Ajv coerceTypes is true for path and query parameters because these are parsed separately from body
and thus are all strings. This in essence turns off validation of properties of type string
because any input type cast to string just works.

```
{
  path: {
    coerceTypes: true,
  },
  query: {
    coerceTypes: true,
  },
  body: {
    coerceTypes: false,
  },
}
```

## TODO:

- More tests and examples of real life validation use-cases like nested objects and arrays etc.
- Sort Schemas alphabetically
- Tests with Jest
