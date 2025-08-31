import { encrypt, decrypt } from './encryption.js';

describe('Encryption Utility', () => {
  const secret = 'my-super-secret-key';
  const text = 'This is a secret message.';

  it('should encrypt and decrypt a string successfully', () => {
    const encrypted = encrypt(text, secret);
    const decrypted = decrypt(encrypted, secret);

    expect(decrypted).toBe(text);
    expect(encrypted).not.toBe(text);
  });

  it('should not decrypt with the wrong secret', () => {
    const wrongSecret = 'another-key';
    const encrypted = encrypt(text, secret);

    // We expect the decryption to throw an error
    expect(() => {
      decrypt(encrypted, wrongSecret);
    }).toThrow();
  });

  it('should produce a different encrypted output each time', () => {
    const encrypted1 = encrypt(text, secret);
    const encrypted2 = encrypt(text, secret);

    // Due to the random salt and IV, the outputs should not be the same
    expect(encrypted1).not.toBe(encrypted2);
  });
}); 