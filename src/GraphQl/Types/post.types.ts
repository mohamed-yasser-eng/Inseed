import { GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { CommentType } from './comment.types'
import { ReactSummaryType } from './react.types'
import { UserType } from './user.types'

const postBaseFields = {
  id: { type: new GraphQLNonNull(GraphQLID) },
  description: { type: GraphQLString },
  attachments: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))) },
  owner: { type: UserType },
  allowComments: { type: GraphQLBoolean },
  tags: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))) },
  commentsCount: { type: new GraphQLNonNull(GraphQLInt) },
  reactsSummary: { type: new GraphQLNonNull(ReactSummaryType) },
  myReact: { type: GraphQLString },
  createdAt: { type: GraphQLString },
}

export const FeedPostType = new GraphQLObjectType({
  name: 'FeedPost',
  fields: postBaseFields,
})

export const PostDetailsType = new GraphQLObjectType({
  name: 'PostDetails',
  fields: {
    ...postBaseFields,
    comments: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommentType))) },
  },
})
