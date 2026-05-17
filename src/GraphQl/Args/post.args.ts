import { GraphQLID, GraphQLNonNull } from 'graphql'

export const postDetailsArgsType = {
  postId: { type: new GraphQLNonNull(GraphQLID) },
}
