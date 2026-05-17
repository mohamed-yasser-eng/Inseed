import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'
import { UserType } from './user.types'

export const MessageMetadataType = new GraphQLObjectType({
  name: 'MessageMetadata',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    text: { type: GraphQLString },
    sender: { type: UserType },
    createdAt: { type: GraphQLString },
  },
})

export const ConversationType = new GraphQLObjectType({
  name: 'Conversation',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    type: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    members: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))) },
    lastMessage: { type: MessageMetadataType },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
})
