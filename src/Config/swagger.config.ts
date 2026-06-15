import { z } from 'zod'
import { openApiSchemaRegistry } from '../Docs/openapi.registry'
import { responseSchemas } from '../Docs/openapi.responses'
import { paths } from '../Docs/openapi.paths'

const API_TITLE = 'Social App API'
const API_VERSION = '1.0.0'
const localServerUrl = `http://localhost:${process.env.PORT ?? '3000'}`

// Turn the registered Zod validators into OpenAPI 3.0 component schemas.
// Zod stamps each generated schema with a `$id`, which is not an OpenAPI 3.0 keyword — strip it.
const buildComponentSchemas = (): Record<string, unknown> => {
  const { schemas } = z.toJSONSchema(openApiSchemaRegistry, {
    target: 'openapi-3.0',
    io: 'output',
    uri: (id) => `#/components/schemas/${id}`,
  })

  return Object.fromEntries(
    Object.entries(schemas).map(([id, schema]) => {
      const { $id, ...rest } = schema as Record<string, unknown>
      return [id, rest]
    }),
  )
}

// The wire envelope every handler returns via SuccessResponse / FailedResponse.
const envelopeSchemas = {
  Meta: {
    type: 'object',
    required: ['status', 'success', 'message'],
    properties: {
      status: { type: 'integer', example: 200 },
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'request is processed successfully' },
    },
  },
  SuccessResponse: {
    type: 'object',
    required: ['meta'],
    properties: {
      meta: { $ref: '#/components/schemas/Meta' },
      // Base envelope: `data` is endpoint-specific and narrowed per operation via allOf.
      data: {},
    },
  },
  ErrorResponse: {
    type: 'object',
    required: ['meta'],
    properties: {
      meta: { $ref: '#/components/schemas/Meta' },
      error: {
        type: 'object',
        properties: {
          context: { type: 'object', nullable: true },
        },
      },
    },
  },
}

const jsonErrorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
})

// Reusable error responses referenced from operations in the route-mapping phase.
const errorResponses = {
  BadRequest: jsonErrorResponse('Validation failed or malformed request'),
  Unauthorized: jsonErrorResponse('Missing, invalid, or blacklisted access token'),
  Forbidden: jsonErrorResponse('Authenticated but not allowed to perform this action'),
  NotFound: jsonErrorResponse('The requested resource does not exist'),
  Conflict: jsonErrorResponse('The resource already exists or conflicts with current state'),
  PayloadTooLarge: jsonErrorResponse('Uploaded file exceeds the size limit'),
  TooManyRequests: {
    ...jsonErrorResponse('Rate limit exceeded'),
    headers: {
      'Retry-After': {
        description: 'Seconds to wait before retrying',
        schema: { type: 'integer' },
      },
    },
  },
}

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: API_TITLE,
    version: API_VERSION,
    description: 'REST API for the social-app backend. Request schemas are generated from the Zod validators.',
  },
  servers: [{ url: localServerUrl, description: 'Local development' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, sessions' },
    { name: 'Users', description: 'Profile, friendships, groups' },
    { name: 'Posts', description: 'Create, update, and read posts' },
    { name: 'Comments', description: 'Comments on posts and comments' },
    { name: 'Reacts', description: 'Reactions on posts and comments' },
    { name: 'System', description: 'Operational endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token sent as `Authorization: Bearer <token>`',
      },
    },
    schemas: {
      ...buildComponentSchemas(),
      ...envelopeSchemas,
      ...responseSchemas,
    },
    responses: errorResponses,
  },
  paths,
}
