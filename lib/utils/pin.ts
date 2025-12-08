import bcrypt from 'bcryptjs'

/**
 * PINをハッシュ化
 */
export async function hashPin(pin: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(pin, saltRounds)
}

/**
 * PINを検証
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin, hash)
}






