// midnight-did.test.ts

import { describe, it, expect } from 'vitest';
import { parseMidnightDID, MidnightNetwork } from '../midnight-did';

const VALID_ID = '0200c14874a279e61d4bf4eebff76f46fada3afbb0183dff21e741975143dcbdab';

describe('parseMidnightDID', () => {
  it('parses did:midnight:<id> as Mainnet', () => {
    const input = `did:midnight:${VALID_ID}`;
    const result = parseMidnightDID(input);

    expect(result.raw).toBe(input);
    expect(result.network).toBe(MidnightNetwork.Mainnet);
    expect(result.id).toBe(VALID_ID);
  });

  it('parses did:midnight:mainnet:<id>', () => {
    const input = `did:midnight:mainnet:${VALID_ID}`;
    const result = parseMidnightDID(input);

    expect(result.raw).toBe(input);
    expect(result.network).toBe(MidnightNetwork.Mainnet);
    expect(result.id).toBe(VALID_ID);
  });

  it('parses did:midnight:testnet:<id>', () => {
    const input = `did:midnight:testnet:${VALID_ID}`;
    const result = parseMidnightDID(input);

    expect(result.raw).toBe(input);
    expect(result.network).toBe(MidnightNetwork.Testnet);
    expect(result.id).toBe(VALID_ID);
  });

  it('parses did:midnight:standalone:<id>', () => {
    const input = `did:midnight:standalone:${VALID_ID}`;
    const result = parseMidnightDID(input);

    expect(result.raw).toBe(input);
    expect(result.network).toBe(MidnightNetwork.Standalone);
    expect(result.id).toBe(VALID_ID);
  });

  it('fails if id is invalid hex', () => {
    const input = 'did:midnight:mainnet:not_hex_id';
    expect(() => parseMidnightDID(input)).toThrow(/Invalid MidnightDID string/);
  });

  it('fails if prefix is wrong', () => {
    const input = `bad:midnight:testnet:${VALID_ID}`;
    expect(() => parseMidnightDID(input)).toThrow(/Invalid MidnightDID string/);
  });

  it('fails if method is wrong', () => {
    const input = `did:other:testnet:${VALID_ID}`;
    expect(() => parseMidnightDID(input)).toThrow(/Invalid MidnightDID string/);
  });

  it('fails if network is invalid', () => {
    const input = `did:midnight:foobar:${VALID_ID}`;
    expect(() => parseMidnightDID(input)).toThrow(/Invalid MidnightDID string/);
  });

  it('fails if too many parts', () => {
    const input = `did:midnight:testnet:extra:${VALID_ID}`;
    expect(() => parseMidnightDID(input)).toThrow(/Invalid MidnightDID string/);
  });
});
