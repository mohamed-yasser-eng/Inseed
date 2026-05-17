import { ConversationModel } from '../../Db/Models'
import { GraphQLContext, requireGraphQLUser } from '../context'
import { graphQLUserPopulateFields, toGraphQLConversation, toObjectId } from '../Utils'

class ConversationResolvers {
  conversations = async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const currentUserId = requireGraphQLUser(context)
    const conversations = await ConversationModel.find({ members: toObjectId(currentUserId) })
      .populate('members', graphQLUserPopulateFields)
      .sort({ updatedAt: -1 })
      .lean()

    return await Promise.all(conversations.map((conversation) => toGraphQLConversation(conversation)))
  }
}

export default ConversationResolvers
