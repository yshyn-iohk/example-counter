import { describe, it, beforeEach, expect } from 'vitest';
import { MidnightDIDSimulator } from './midnight-did-simulator';
import { VerificationMethodType, VerificationMethodRelation } from '../managed/did/contract/index.cjs';

const mockMethod = {
    id: 'did:midnight:xyz#key-1',
    type: VerificationMethodType.Ed25519VerificationKey2020,
    publicKey: new Uint8Array(32).fill(1),
};

describe('MidnightDIDSimulator', () => {
    let sim: MidnightDIDSimulator;

    beforeEach(() => {
        sim = new MidnightDIDSimulator();
    });

    it('initializes with an empty ledger', () => {
        const ledger = sim.getLedger();
        expect(ledger.id.bytes.length).toBe(32);
        expect(ledger.version).toBe(0n);
        expect(ledger.active).toBe(true);
        expect(ledger.verificationMethods.isEmpty).toBeTruthy;
        expect(ledger.authenticationRelation.isEmpty).toBeTruthy;
        expect(ledger.verificationMethods.isEmpty).toBeTruthy;
        expect(ledger.authenticationRelation.isEmpty).toBeTruthy; 
        expect(ledger.capabilityInvocationRelation.isEmpty).toBeTruthy;
        expect(ledger.capabilityDelegationRelation.isEmpty).toBeTruthy;
    });

    it('adds a verification method', () => {
        const ledger = sim.addVerificationMethod(mockMethod);
        expect(ledger.verificationMethods.member(mockMethod.id)).toBeTruthy;
    });

    it('fails to add duplicate verification method', () => {
        sim.addVerificationMethod(mockMethod);
        expect(() => sim.addVerificationMethod(mockMethod)).toThrow();
    });

    it('updates a verification method', () => {
        sim.addVerificationMethod(mockMethod);
        const updated = { ...mockMethod, publicKey: new Uint8Array(32).fill(9) };
        
        const ledger = sim.updateVerificationMethod(updated);
        expect(ledger.verificationMethods.lookup(mockMethod.id).publicKey)
            .toEqual(updated.publicKey);
        expect(ledger.verificationMethods.lookup(mockMethod.id).type)
            .toEqual(mockMethod.type);
        expect(ledger.verificationMethods.lookup(mockMethod.id).id)
            .toEqual(mockMethod.id);
    });

    it('fails to update non-existent verification method', () => {
        expect(() => sim.updateVerificationMethod(mockMethod)).toThrow();
    });

    it('removes a verification method', () => {
        sim.addVerificationMethod(mockMethod);
        const ledger = sim.removeVerificationMethod(mockMethod.id);
        expect(ledger.verificationMethods.member(mockMethod.id)).not.toBeTruthy();
    });

    it('fails to remove non-existent verification method', () => {
        expect(() => sim.removeVerificationMethod(mockMethod.id)).toThrow();
    });

    it('adds and removes a relation', () => {
        sim.addVerificationMethod(mockMethod);
        sim.addRelation(VerificationMethodRelation.Authentication, mockMethod.id);
        let ledger = sim.getLedger();
        
        expect(ledger.authenticationRelation.member(mockMethod.id)).toBeTruthy;

        sim.removeRelation(VerificationMethodRelation.Authentication, mockMethod.id);
        
        ledger = sim.getLedger();
        expect(ledger.authenticationRelation.member(mockMethod.id)).not.toBeTruthy;
    });

    it('fails to add relation to unknown method', () => {
        expect(() => sim.addRelation(VerificationMethodRelation.Authentication, mockMethod.id)).toThrow();
    });

    it('fails to remove unknown relation', () => {
        sim.addVerificationMethod(mockMethod);
        expect(() => sim.removeRelation(VerificationMethodRelation.Authentication, mockMethod.id)).toThrow();
    });

    it('deactivates the DID', () => {
        const ledger = sim.deactivate();
        expect(ledger.active).toBe(false);
    });

    it('fails to perform operations after deactivation', () => {
        sim.deactivate();
        expect(() => sim.addVerificationMethod(mockMethod)).toThrow();
    });
});
