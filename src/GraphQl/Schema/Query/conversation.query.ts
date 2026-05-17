import { GraphQLList } from 'graphql'

import ConversationResolvers from '../../Resolvers/conversation.resolvers'
import { ConversationType } from '../../Types/conversation.types'

class ConversationQuery {
  private conversationResolvers: ConversationResolvers = new ConversationResolvers()

  register() {
    return {
      conversations: {
        type: new GraphQLList(ConversationType),
        resolve: this.conversationResolvers.conversations,
      },
    }
  }
}

export default new ConversationQuery()
