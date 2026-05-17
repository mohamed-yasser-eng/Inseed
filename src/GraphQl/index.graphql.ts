import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { createHandler } from 'graphql-http/lib/use/express'

import { createGraphQLContext } from './context'
import conversationQuery from './Schema/Query/conversation.query'
import postQuery from './Schema/Query/post.query'
import profileQuery from './Schema/Query/profile.query'

export const MainSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'QueryMainSchema',
    description: 'Main schema for GraphQL',
    fields: {
      ...postQuery.register(),
      ...profileQuery.register(),
      ...conversationQuery.register(),
    },
  }),
})

export const graphQLHandler = createHandler({
  schema: MainSchema,
  context: (req) => createGraphQLContext(req.headers),
})
