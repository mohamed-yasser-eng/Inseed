import { GraphQLBoolean, GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'

export const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: GraphQLString },
    gender: { type: GraphQLString },
    DOB: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    coverPicture: { type: GraphQLString },
    phoneNumber: { type: GraphQLString },
    isVerified: { type: GraphQLBoolean },
  },
})
