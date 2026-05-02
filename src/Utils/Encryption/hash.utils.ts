import { compareSync, hashSync } from 'bcrypt'

export const generateHash = (plainText: string, saltRounds: number = parseInt(process.env.SALT_ROUNDS as string)): string => {
  return hashSync(plainText, saltRounds)
}

export const compareHash = (plainText: string, hashedText: string): boolean => {
  return compareSync(plainText, hashedText)
}
