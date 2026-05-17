import { ChatTypeEnum, FriendShipStatusEnum } from '../../Common'
import { ConversationModel, FriendShipModel, PostModel, UserModel } from '../../Db/Models'
import { GraphQLContext, requireGraphQLUser } from '../context'
import { graphQLUserPopulateFields, toGraphQLConversation, toGraphQLPost, toGraphQLUser, toObjectId } from '../Utils'

class ProfileResolvers {
  profileDashboard = async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const currentUserId = requireGraphQLUser(context)
    const currentUserObjectId = toObjectId(currentUserId)

    const [user, posts, pendingReceived, pendingSent, friends, groups] = await Promise.all([
      UserModel.findById(currentUserId).select('-password -OTPS').lean(),
      PostModel.find({ ownerId: currentUserId })
        .populate('ownerId', graphQLUserPopulateFields)
        .populate('tags', graphQLUserPopulateFields)
        .sort({ createdAt: -1 })
        .lean(),
      FriendShipModel.countDocuments({ requestToId: currentUserObjectId, status: FriendShipStatusEnum.PENDING }),
      FriendShipModel.countDocuments({ requestFromId: currentUserObjectId, status: FriendShipStatusEnum.PENDING }),
      FriendShipModel.countDocuments({
        $or: [{ requestFromId: currentUserObjectId }, { requestToId: currentUserObjectId }],
        status: FriendShipStatusEnum.ACCEPTED,
      }),
      ConversationModel.find({ type: ChatTypeEnum.GROUP, members: currentUserObjectId })
        .populate('members', graphQLUserPopulateFields)
        .sort({ updatedAt: -1 })
        .lean(),
    ])

    return {
      currentUser: toGraphQLUser(user),
      recentPosts: await Promise.all(posts.map((post) => toGraphQLPost(post, currentUserId))),
      friendshipSummary: { pendingReceived, pendingSent, friends },
      groups: await Promise.all(groups.map((group) => toGraphQLConversation(group))),
    }
  }
}

export default ProfileResolvers
