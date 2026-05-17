import { GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import { ConversationType } from './conversation.types'
import { FeedPostType } from './post.types'
import { UserType } from './user.types'

export const FriendshipSummaryType = new GraphQLObjectType({
  name: 'FriendshipSummary',
  fields: {
    pendingReceived: { type: new GraphQLNonNull(GraphQLInt) },
    pendingSent: { type: new GraphQLNonNull(GraphQLInt) },
    friends: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

export const ProfileDashboardType = new GraphQLObjectType({
  name: 'ProfileDashboard',
  fields: {
    currentUser: { type: UserType },
    recentPosts: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(FeedPostType))) },
    friendshipSummary: { type: new GraphQLNonNull(FriendshipSummaryType) },
    groups: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ConversationType))) },
  },
})
