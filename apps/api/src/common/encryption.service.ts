import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

/**
 * EncryptionService — AES-256-GCM symmetric encryption for OAuth tokens.
 * Tokens are encrypted before storage and decrypted only when needed for API calls.
 * The encryption key NEVER leaves the server.
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer

  constructor(private readonly config: ConfigService) {
    const hexKey = this.config.getOrThrow<string>('ENCRYPTION_KEY')
    if (hexKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
    }
    this.key = Buffer.from(hexKey, 'hex')
  }

  /**
   * Encrypt a plaintext string.
   * Returns: iv:authTag:ciphertext (all hex encoded)
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv)

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])

    const authTag = cipher.getAuthTag()

    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':')
  }

  /**
   * Decrypt an encrypted string produced by encrypt().
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format')
    }

    const [ivHex, authTagHex, ciphertextHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8')
  }
}
