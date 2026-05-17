import ProfileResolvers from '../../Resolvers/profile.resolvers'
import { ProfileDashboardType } from '../../Types/profile.types'

class ProfileQuery {
  private profileResolvers: ProfileResolvers = new ProfileResolvers()

  register() {
    return {
      profileDashboard: {
        type: ProfileDashboardType,
        resolve: this.profileResolvers.profileDashboard,
      },
    }
  }
}

export default new ProfileQuery()
