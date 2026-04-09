import { EncryptionService } from '../common/encryption.service'
import { ConfigService } from '@nestjs/config'

// Generate a deterministic test key (32 bytes = 64 hex chars)
const TEST_KEY = 'a'.repeat(64)

function makeService(): EncryptionService {
  const config = {
    getOrThrow: jest.fn().mockReturnValue(TEST_KEY),
  } as unknown as ConfigService
  return new EncryptionService(config)
}

describe('EncryptionService', () => {
  let service: EncryptionService

  beforeEach(() => {
    service = makeService()
  })

  it('encrypts and decrypts a token correctly', () => {
    const plaintext = 'strava_access_token_abc123'
    const encrypted = service.encrypt(plaintext)
    const decrypted = service.decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertext each time (random IV)', () => {
    const plaintext = 'same_token'
    const enc1 = service.encrypt(plaintext)
    const enc2 = service.encrypt(plaintext)
    expect(enc1).not.toBe(enc2) // Different IVs
    // But both decrypt to same value
    expect(service.decrypt(enc1)).toBe(plaintext)
    expect(service.decrypt(enc2)).toBe(plaintext)
  })

  it('encrypted format has 3 colon-separated parts (iv:tag:ciphertext)', () => {
    const encrypted = service.encrypt('test_token')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    expect(parts[0]).toHaveLength(32) // IV: 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32) // Auth tag: 16 bytes = 32 hex chars
  })

  it('throws on tampered ciphertext', () => {
    const encrypted = service.encrypt('sensitive_token')
    const parts = encrypted.split(':')
    // Tamper with the ciphertext
    parts[2] = parts[2].split('').reverse().join('')
    const tampered = parts.join(':')
    expect(() => service.decrypt(tampered)).toThrow()
  })

  it('throws on malformed input', () => {
    expect(() => service.decrypt('not:a:valid:encrypted:string')).toThrow()
    expect(() => service.decrypt('invalid')).toThrow()
  })

  it('handles long tokens (Strava tokens are typically 40+ chars)', () => {
    const longToken = 'a'.repeat(128)
    const encrypted = service.encrypt(longToken)
    expect(service.decrypt(encrypted)).toBe(longToken)
  })

  it('handles tokens with special characters', () => {
    const specialToken = 'token/with+special=chars&and%20spaces'
    const encrypted = service.encrypt(specialToken)
    expect(service.decrypt(encrypted)).toBe(specialToken)
  })

  it('throws if ENCRYPTION_KEY is not 64 chars', () => {
    const badConfig = {
      getOrThrow: jest.fn().mockReturnValue('short_key'),
    } as unknown as ConfigService
    expect(() => new EncryptionService(badConfig)).toThrow('ENCRYPTION_KEY must be a 64-character hex string')
  })
})
