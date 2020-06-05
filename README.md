# Persnickety

Persnickety is an OAS3 / Swagger [(Open API Spec version 3)](https://swagger.io/specification/) helper tool.

It currently contains:

- A generator for path and model specifications
- A request validator for path, query and body parameters (Express middleware)

## Default AJV options

```
{
  coerceTypes: true,
}
```

TODO:

- Proper path and query param validation
- Check required params
- Client generator
- Sort Schemas alphabetically
