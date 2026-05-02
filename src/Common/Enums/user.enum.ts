enum RoleEnum {
  ADMIN = 'admin',
  USER = 'user',
}

enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

enum ProviderEnum {
  LOCAL = 'local',
  GOOGLE = 'google',
}

enum OtpTypesEnum {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

enum FriendShipStatusEnum {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

enum ChatTypeEnum {
  DIRECT = 'direct',
  GROUP = 'group',
}

export { ChatTypeEnum, FriendShipStatusEnum, GenderEnum, OtpTypesEnum, ProviderEnum, RoleEnum };

