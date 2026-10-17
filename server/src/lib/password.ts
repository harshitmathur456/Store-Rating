import argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

/** Dummy hash for timing-safe comparison on unknown emails */
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$aaaaaaaaaaaaaaaaaaaaaaaa$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

export async function verifyDummyPassword(): Promise<boolean> {
  try {
    await argon2.verify(DUMMY_HASH, 'dummy-password-for-timing');
  } catch {
    // Expected to fail
  }
  return false;
}
