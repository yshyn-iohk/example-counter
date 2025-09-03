import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { Buffer } from "buffer";

import {
  createDIDDocument,
  createVerificationMethod,
  CurveType,
  DIDDocument,
  KeyType,
  PublicKeyJwk,
  VerificationMethod,
  VerificationMethodRelationType,
  VerificationMethodType
} from "./did-document";
import { DIDOperation, DIDOperationType } from "./did-operations";
import { OperationBuilder } from "./ledger-operation-builder";
import {
  CurveType as LedgerCurveType,
  DIDUpdateOperation as LedgerUpdateOperation,
  KeyType as LedgerKeyType,
  Ledger,
  OperationType as LedgerOperationType,
  PublicKeyJwk as LedgerPublicKeyJwk,
  Service as LedgerService,
  VerificationMethod as LedgerVerificationMethod,
  VerificationMethodRelation as LedgerVerificationMethodRelation,
  VerificationMethodType as LedgerVerificationMethodType
} from "./managed/did/contract/index.cjs";
import {
  ContractAddress as MidnightContractAddress,
  createMidnightDIDString,
  MidnightNetwork,
  parseContractAddress
} from "./midnight-did";

//TODO: rename DIDDocument to Domain
export class LedgerToDIDDocument {
  static readonly KeyTypeMap: Record<LedgerKeyType, KeyType> = {
    [LedgerKeyType.EC]: KeyType.EC,
    [LedgerKeyType.RSA]: KeyType.RSA,
    [LedgerKeyType.oct]: KeyType.oct
  };

  static readonly CurveTypeMap: Record<LedgerCurveType, CurveType> = {
    [LedgerCurveType.ed25519]: CurveType.ed25519,
    [LedgerCurveType.Jubjub]: CurveType.Jubjub
  };

  static readonly VerificationMethodTypeMap: Record<
    LedgerVerificationMethodType,
    VerificationMethodType
  > = {
    [LedgerVerificationMethodType.Undefined]: VerificationMethodType.Undefined,
    [LedgerVerificationMethodType.Ed25519VerificationKey2020]:
      VerificationMethodType.Ed25519VerificationKey2020,
    [LedgerVerificationMethodType.JubJubVerificationKey2025]:
      VerificationMethodType.JubJubVerificationKey2025
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

  static publicKeyJwk(publicKeyJwk: LedgerPublicKeyJwk): PublicKeyJwk {
    return {
      kty: this.KeyTypeMap[publicKeyJwk.kty],
      crv: this.CurveTypeMap[publicKeyJwk.crv],
      x: publicKeyJwk.x,
      y: publicKeyJwk.y
    };
  }

  static toJSON(ledger: Ledger): object {
    return {
      id: Buffer.from(ledger.id.bytes).toString("hex"),
      version: Number(ledger.version.toString()),
      active: ledger.active,
      operationCount: Number(ledger.operationCount.toString()),
      verificationMethods: Array.from(
        ledger.verificationMethods,
        ([id, method]) => ({
          id,
          type: method.type,
          publicKeyJwk: this.publicKeyJwk(method.publicKeyJwk)
        })
      ),
      authenticationRelation: Array.from(ledger.authenticationRelation),
      assertionMethodRelation: Array.from(ledger.assertionMethodRelation),
      keyAgreementRelation: Array.from(ledger.keyAgreementRelation),
      capabilityInvocationRelation: Array.from(
        ledger.capabilityInvocationRelation
      ),
      capabilityDelegationRelation: Array.from(
        ledger.capabilityDelegationRelation
      ),
      services: Array.from(ledger.services, ([id, service]) => ({
        id,
        type: service.type,
        serviceEndpoint: service.serviceEndpoint
      }))
    };
  }

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
    //TODO: think about the context for the new key type
    const MidnightDIDDocumentContext = Array.of("https://www.w3.org/ns/did/v1");

    //const contractAddress = parseContractAddress(Buffer.from(ledger.id.bytes).toString("hex"));

    const did = createMidnightDIDString(contractAddress, network);

    const verificationMethod = [];
    for (const [id, method] of ledger.verificationMethods) {
      verificationMethod.push(
        createVerificationMethod({
          id,
          type: LedgerToDIDDocument.VerificationMethodTypeMap[method.type],
          controller: did,
          publicKeyJwk: this.publicKeyJwk(method.publicKeyJwk)
        })
      );
    }

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
  static readonly KeyTypeMap: Record<KeyType, LedgerKeyType> = {
    [KeyType.EC]: LedgerKeyType.EC,
    [KeyType.RSA]: LedgerKeyType.RSA,
    [KeyType.oct]: LedgerKeyType.oct
  };

  static readonly CurveTypeMap: Record<CurveType, LedgerCurveType> = {
    [CurveType.ed25519]: LedgerCurveType.ed25519,
    [CurveType.Jubjub]: LedgerCurveType.Jubjub
  };

  static readonly VerificationMethodTypeMap: Record<
    VerificationMethodType,
    LedgerVerificationMethodType
  > = {
    [VerificationMethodType.Undefined]: LedgerVerificationMethodType.Undefined,
    [VerificationMethodType.Ed25519VerificationKey2020]:
      LedgerVerificationMethodType.Ed25519VerificationKey2020,
    [VerificationMethodType.JubJubVerificationKey2025]:
      LedgerVerificationMethodType.JubJubVerificationKey2025
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

  static publicKeyJwk(publicKeyJwk: PublicKeyJwk): LedgerPublicKeyJwk {
    return {
      kty: this.KeyTypeMap[publicKeyJwk.kty],
      crv: this.CurveTypeMap[publicKeyJwk.crv],
      x: publicKeyJwk.x,
      y: publicKeyJwk.y
    };
  }

  static verificationMethod(
    method: VerificationMethod
  ): LedgerVerificationMethod {
    return {
      id: method.id,
      type: this.VerificationMethodTypeMap[method.type],
      publicKeyJwk: this.publicKeyJwk(method.publicKeyJwk)
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
    publicKeyJwk: OperationBuilder.defaultPublicKeyJwk
  };

  //TODO: clarify with Midnight team how to init the default struct
  static defaultLedgerUpdateOperation(): LedgerUpdateOperation {
    return {
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
        service: {
          id: "",
          type: "",
          serviceEndpoint: Array.of("", "", "", "")
        }
      },
      updateServiceOptions: {
        service: {
          id: "",
          type: "",
          serviceEndpoint: Array.of("", "", "", "")
        }
      },
      removeServiceOptions: {
        id: ""
      }
    };
  }

  static updateOperation(updateOperation: DIDOperation): LedgerUpdateOperation {
    const { type } = updateOperation;
    let ledgerUpdateOperation = this.defaultLedgerUpdateOperation();
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
