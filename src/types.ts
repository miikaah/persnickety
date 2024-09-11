export type ExpressRequest = {
  originalUrl: string;
  method: string;
  body: any;
};
export type ExpressResponse = any;
export type ExpressNextFunction = (
  options?:
    | {
        status: number;
        toString: () => string;
      }
    | string,
) => void;

export type AjvOptions = {
  path: {
    coerceTypes: boolean;
  };
  query: {
    coerceTypes: boolean;
  };
  body: {
    coerceTypes: boolean;
  };
};

export type RequestValidatorOptions = AjvOptions & {
  callback: ((req: ExpressRequest, results: any) => void) | undefined;
};

export type SchemaSkeleton = {
  [x: string]: unknown;
  paths: {
    [x: string]: {
      [x: string]: {
        requestBody: {
          [x: string]: unknown;
          content: any;
        };
        parameters: Record<string, string>[];
      };
    };
  };
  components: {
    [x: string]: Record<string, unknown>;
  };
};
