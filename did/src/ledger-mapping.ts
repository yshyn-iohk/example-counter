import {
  Ledger,
  VerificationMethodType as LedgerVerificationMethodType,
  VerificationMethodRelation as LedgerVerificationMethodRelation,
  VerificationMethod as LedgerVerificationMethod
} from "./managed/did/contract/index.cjs";
import {
  VerificationMethodType,
  VerificationMethodRelationType
} from "./did-document";
import {
  bytesToPublicKeyMultibase,
  createDIDDocument,
  createVerificationMethod,
  DIDDocument,
  VerificationMethod,
  publicKeyMultibaseToBytes
} from "./did-document";
import { MidnightNetwork, createMidnightDID } from "./midnight-did";

export class LedgerToDIDDocument {
  static readonly VerificationMethodTypeMap: Record<
    LedgerVerificationMethodType,
    VerificationMethodType
  > = {
    [LedgerVerificationMethodType.Ed25519VerificationKey2020]:
      VerificationMethodType.Ed25519VerificationKey2020,
    [LedgerVerificationMethodType.RedJubJubVerificationKey2025]:
      VerificationMethodType.RedJubJubVerificationKey2025
  };

  static readonly VerificationMethodRelationMap: Record<
    LedgerVerificationMethodRelation,
    VerificationMethodRelationType
  > = {
    [LedgerVerificationMethodRelation.Authentication]:
      VerificationMethodRelationType.Authentication,
    [LedgerVerificationMethodRelation.AssertionMethod]:
      VerificationMethodRelationType.AssertionMethod,
    [LedgerVerificationMethodRelation.KeyAgreement]:
      VerificationMethodRelationType.KeyAgreement,
    [LedgerVerificationMethodRelation.CapabilityInvocation]:
      VerificationMethodRelationType.CapabilityInvocation,
    [LedgerVerificationMethodRelation.CapabilityDelegation]:
      VerificationMethodRelationType.CapabilityDelegation
  };

  /**
   * Converts a Ledger to a DIDDocument for the Midnight DID method.
   * @param did - MidnightDID associated with the ledger
   * @param ledger - Ledger object from the contract state
   * @returns DIDDocument
   */
  static ledgerStateToDIDDocument(
    ledger: Ledger,
    network: MidnightNetwork
  ): DIDDocument {
    const MidnightDIDDocumentContext = Array.of("http://localhost/foo/bar");

    const contractAddress = Buffer.from(ledger.id.bytes).toString("hex");

    const did = createMidnightDID(contractAddress, network);

    const verificationMethod = Array.from(ledger.verificationMethods).map(
      ([id, method]) =>
        createVerificationMethod({
          id: id,
          type: LedgerToDIDDocument.VerificationMethodTypeMap[method.type],
          controller: did,
          publicKeyMultibase: bytesToPublicKeyMultibase(method.publicKey)
        })
    );

    const assertionMethod = ledger.assertionMethodRelation.isEmpty()
      ? undefined
      : Array.from(ledger.assertionMethodRelation);

    const authentication = ledger.authenticationRelation.isEmpty()
      ? undefined
      : Array.from(ledger.authenticationRelation);

    const capabilityDelegation = ledger.capabilityDelegationRelation.isEmpty()
      ? undefined
      : Array.from(ledger.capabilityDelegationRelation);

    const capabilityInvocation = ledger.capabilityInvocationRelation.isEmpty()
      ? undefined
      : Array.from(ledger.capabilityInvocationRelation);

    const keyAgreement = ledger.keyAgreementRelation.isEmpty()
      ? undefined
      : Array.from(ledger.keyAgreementRelation);

    const didDocument = createDIDDocument({
      id: did,
      context: MidnightDIDDocumentContext,
      alsoKnownAs: undefined,
      controller: did,
      verificationMethod: verificationMethod,
      authentication: authentication,
      assertionMethod: assertionMethod,
      keyAgreement: keyAgreement,
      capabilityInvocation: capabilityInvocation,
      capabilityDelegation: capabilityDelegation,
      service: undefined //TODO
    });

    return didDocument;
  }
}

// TODO: rename DomainToLedger
export class DIDDocumentToLedger {
  static readonly VerificationMethodTypeMap: Record<
    VerificationMethodType,
    LedgerVerificationMethodType
  > = {
    [VerificationMethodType.Ed25519VerificationKey2020]:
      LedgerVerificationMethodType.Ed25519VerificationKey2020,
    [VerificationMethodType.RedJubJubVerificationKey2025]:
      LedgerVerificationMethodType.RedJubJubVerificationKey2025
  };

  static readonly VerificationMethodRelationMap: Record<
    VerificationMethodRelationType,
    LedgerVerificationMethodRelation
  > = {
    [VerificationMethodRelationType.Authentication]:
      LedgerVerificationMethodRelation.Authentication,
    [VerificationMethodRelationType.AssertionMethod]:
      LedgerVerificationMethodRelation.AssertionMethod,
    [VerificationMethodRelationType.KeyAgreement]:
      LedgerVerificationMethodRelation.KeyAgreement,
    [VerificationMethodRelationType.CapabilityInvocation]:
      LedgerVerificationMethodRelation.CapabilityInvocation,
    [VerificationMethodRelationType.CapabilityDelegation]:
      LedgerVerificationMethodRelation.CapabilityDelegation
  };

  static verificationMethod(method: VerificationMethod): LedgerVerificationMethod {
    return {
      id: method.id,
      type: this.VerificationMethodTypeMap[method.type],
      publicKey: publicKeyMultibaseToBytes(method.publicKeyMultibase)
    };
  }
}
