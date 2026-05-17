import { GraphQLInt, GraphQLNonNull, GraphQLObjectType } from 'graphql'

export const ReactSummaryType = new GraphQLObjectType({
  name: 'ReactSummary',
  fields: {
    like: { type: new GraphQLNonNull(GraphQLInt) },
    love: { type: new GraphQLNonNull(GraphQLInt) },
    haha: { type: new GraphQLNonNull(GraphQLInt) },
    sad: { type: new GraphQLNonNull(GraphQLInt) },
    angry: { type: new GraphQLNonNull(GraphQLInt) },
    total: { type: new GraphQLNonNull(GraphQLInt) },
  },
})
