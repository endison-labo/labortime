/**
 * organization_slug 生成ユーティリティ
 * 
 * ランダム英字20-24桁の organization_slug を生成します
 * 一度発行したら変更不可（永続ID）として扱います
 */

/**
 * ランダムな英字文字列を生成
 * @param length 生成する文字列の長さ
 * @returns ランダムな英字文字列（小文字）
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * organization_slug を生成
 * 20-24桁のランダム英字を生成します
 * 
 * @returns ランダムな organization_slug
 */
export function generateOrganizationSlug(): string {
  // 20-24桁のランダムな長さを生成
  const length = 20 + Math.floor(Math.random() * 5)
  return generateRandomString(length)
}

/**
 * organization_slug のバリデーション
 * 
 * @param slug 検証する slug
 * @returns 有効な場合は true
 */
export function isValidOrganizationSlug(slug: string): boolean {
  // 20-24桁の英字（小文字）のみ
  return /^[a-z]{20,24}$/.test(slug)
}

