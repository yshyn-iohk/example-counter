import { Buffer } from "buffer";

import {
  bytesToPublicKeyMultibase,
  createDIDDocument,
  createVerificationMethod,
  DIDDocument,
  publicKeyMultibaseToBytes,
  VerificationMethod,
  VerificationMethodRelationType,
  VerificationMethodType
} from "./did-document";
import { DIDOperation, DIDOperationType } from "./did-operations";
import {
  DIDUpdateOperation as LedgerUpdateOperation,
  Ledger,
  OperationType as LedgerOperationType,
  VerificationMethod as LedgerVerificationMethod,
  VerificationMethodRelation as LedgerVerificationMethodRelation,
  VerificationMethodType as LedgerVerificationMethodType
} from "./managed/did/contract/index.cjs";
import { 
    createMidnightDIDString, 
    MidnightNetwork, 
    parseContractAddress,
    ContractAddress as MidnightContractAddress
} from "./midnight-did";
import { ContractAddress } from "@midnight-ntwrk/compact-runtime";

//TODO: rename DIDDocument to Domain
export class LedgerToDIDDocument {
  static readonly VerificationMethodTypeMap: Record<
    LedgerVerificationMethodType,
    VerificationMethodType
  > = {
    [LedgerVerificationMethodType.Undefined]: VerificationMethodType.Undefined,
    [LedgerVerificationMethodType.Ed25519VerificationKey2020]:
      VerificationMethodType.Ed25519VerificationKey2020,
    [LedgerVerificationMethodType.RedJubJubVerificationKey2025]:
      VerificationMethodType.RedJubJubVerificationKey2025
  };

  static readonly VerificationMethodRelationMap: Record<
    LedgerVerificationMethodRelation,
    VerificationMethodRelationType
  > = {
    [LedgerVerificationMethodRelation.Undefined]:
      VerificationMethodRelationType.Undefined,
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
    network: MidnightNetwork,
    contractAddress: MidnightContractAddress
  ): DIDDocument {
    //TODO: replace the context with the real
    //TODO: think about the context for the new key type
    const MidnightDIDDocumentContext = Array.of("http://localhost/foo/bar");

    //const contractAddress = parseContractAddress(Buffer.from(ledger.id.bytes).toString("hex"));

    const did = createMidnightDIDString(contractAddress, network);

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

// TODO: rename DIDDocument to Domain
export class DIDDocumentToLedger {
  static readonly VerificationMethodTypeMap: Record<
    VerificationMethodType,
    LedgerVerificationMethodType
  > = {
    [VerificationMethodType.Undefined]: LedgerVerificationMethodType.Undefined,
    [VerificationMethodType.Ed25519VerificationKey2020]:
      LedgerVerificationMethodType.Ed25519VerificationKey2020,
    [VerificationMethodType.RedJubJubVerificationKey2025]:
      LedgerVerificationMethodType.RedJubJubVerificationKey2025
  };

  static readonly VerificationMethodRelationMap: Record<
    VerificationMethodRelationType,
    LedgerVerificationMethodRelation
  > = {
    [VerificationMethodRelationType.Undefined]:
      LedgerVerificationMethodRelation.Undefined,
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

  static verificationMethod(
    method: VerificationMethod
  ): LedgerVerificationMethod {
    return {
      id: method.id,
      type: this.VerificationMethodTypeMap[method.type],
      publicKey: publicKeyMultibaseToBytes(method.publicKeyMultibase)
    };
  }

  static readonly OperationMap: Record<DIDOperationType, LedgerOperationType> =
    {
      [DIDOperationType.AddVerificationMethod]:
        LedgerOperationType.AddVerificationMethod,
      [DIDOperationType.UpdateVerificationMethod]:
        LedgerOperationType.UpdateVerificationMethod,
      [DIDOperationType.RemoveVerificationMethod]:
        LedgerOperationType.RemoveVerificationMethod,
      [DIDOperationType.AddVerificationMethodRelation]:
        LedgerOperationType.AddVerificationMethodRelation,
      [DIDOperationType.RemoveVerificationMethodRelation]:
        LedgerOperationType.RemoveVerificationMethodRelation,
      [DIDOperationType.Deactivate]: LedgerOperationType.Deactivate
    };

  static undefinedVerificationMethod: LedgerVerificationMethod = {
    id: "",
    type: LedgerVerificationMethodType.Undefined,
    publicKey: new Uint8Array(32)
  };

  //TODO: clarify with Midnight team how to init the default struct
  static defaultLedgerUpdateOperation: LedgerUpdateOperation = {
    operationType: LedgerOperationType.Undefined,
    addVerificationMethodOptions: {
      verificationMethod: this.undefinedVerificationMethod
    },
    updateVerificationMethodOptions: {
      verificationMethod: this.undefinedVerificationMethod
    },
    removeVerificationMethodOptions: {
      id: ""
    },
    addVerificationMethodRelationOptions: {
      relation: LedgerVerificationMethodRelation.Undefined,
      methodId: ""
    },
    removeVerificationMethodRelationOptions: {
      relation: LedgerVerificationMethodRelation.Undefined,
      methodId: ""
    },
    addServiceOptions: {
      id: "",
      type: "",
      serviceEndpoint: Array.of("", "", "", "")
    },
    updateServiceOptions: {
      id: "",
      type: "",
      serviceEndpoint: Array.of("", "", "", "")
    },
    removeServiceOptions: {
      id: ""
    }
  };

  static updateOperation(updateOperation: DIDOperation): LedgerUpdateOperation {
    const { type } = updateOperation;
    let ledgerUpdateOperation = this.defaultLedgerUpdateOperation;
    ledgerUpdateOperation.operationType = this.OperationMap[type];

    switch (type) {
      case DIDOperationType.AddVerificationMethod:
        ledgerUpdateOperation.addVerificationMethodOptions = {
          verificationMethod: this.verificationMethod(
            updateOperation.verificationMethod
          )
        };
        return ledgerUpdateOperation;
      case DIDOperationType.UpdateVerificationMethod:
        ledgerUpdateOperation.updateVerificationMethodOptions = {
          verificationMethod: this.verificationMethod(
            updateOperation.verificationMethod
          )
        };
        return ledgerUpdateOperation;
      case DIDOperationType.RemoveVerificationMethod:
        ledgerUpdateOperation.removeVerificationMethodOptions = {
          id: updateOperation.id
        };
        return ledgerUpdateOperation;
      case DIDOperationType.AddVerificationMethodRelation:
        ledgerUpdateOperation.addVerificationMethodRelationOptions = {
          methodId: updateOperation.methodId,
          relation: this.VerificationMethodRelationMap[updateOperation.relation]
        };
        return ledgerUpdateOperation;
      case DIDOperationType.RemoveVerificationMethodRelation:
        ledgerUpdateOperation.removeVerificationMethodRelationOptions = {
          methodId: updateOperation.methodId,
          relation: this.VerificationMethodRelationMap[updateOperation.relation]
        };
        return ledgerUpdateOperation;
      case DIDOperationType.Deactivate:
        return ledgerUpdateOperation;
      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }
  }

  static updateOperations(
    operations: Array<DIDOperation>
  ): Array<LedgerUpdateOperation> {
    return operations.map((op) => this.updateOperation(op));
  }
}
