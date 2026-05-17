import { GraphQLList } from 'graphql'

import { postDetailsArgsType } from '../../Args/post.args'
import PostResolvers from '../../Resolvers/post.resolvers'
import { FeedPostType, PostDetailsType } from '../../Types/post.types'

class PostQuery {
  private postResolvers: PostResolvers = new PostResolvers()

  register() {
    return {
      feed: {
        type: new GraphQLList(FeedPostType),
        resolve: this.postResolvers.feed,
      },
      postDetails: {
        type: PostDetailsType,
        args: postDetailsArgsType,
        resolve: this.postResolvers.postDetails,
      },
    }
  }
}

export default new PostQuery()
