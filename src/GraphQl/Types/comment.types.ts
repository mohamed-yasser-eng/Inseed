import { GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { ReactSummaryType } from './react.types'
import { UserType } from './user.types'

export const CommentType = new GraphQLObjectType({
  name: 'Comment',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    content: { type: GraphQLString },
    attachments: { type: GraphQLString },
    owner: { type: UserType },
    refId: { type: GraphQLID },
    onModel: { type: GraphQLString },
    reactsSummary: { type: new GraphQLNonNull(ReactSummaryType) },
    myReact: { type: GraphQLString },
    createdAt: { type: GraphQLString },
  },
})
