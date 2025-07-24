import {
    DIDUpdateOperation,
    OperationType,
    VerificationMethod,
    VerificationMethodRelation,
    VerificationMethodType,
    AddVerificationMethodOptions,
    UpdateVerificationMethodOptions,
    RemoveVerificationMethodOptions,
    AddVerificationMethodRelationOptions,
    RemoveVerificationMethodRelationOptions,
    AddServiceOptions,
    UpdateServiceOptions,
    RemoveServiceOptions
} from "./managed/did/contract/index.cjs";

export class OperationBuilder {
    static defaultVerificationMethod: VerificationMethod = {
        id: "",
        type: VerificationMethodType.Undefined,
        publicKey: new Uint8Array(32).fill(0),
    };

    static defaultDIDUpdateOperation: DIDUpdateOperation = {
        operationType: OperationType.Undefined,
        addVerificationMethodOptions: {
            verificationMethod: this.defaultVerificationMethod,
        },
        updateVerificationMethodOptions: {
            verificationMethod: this.defaultVerificationMethod,
        },
        removeVerificationMethodOptions: {
            id: "",
        },
        addVerificationMethodRelationOptions: {
            relation: VerificationMethodRelation.Undefined,
            methodId: "",
        },
        removeVerificationMethodRelationOptions: {
            relation: VerificationMethodRelation.Undefined,
            methodId: "",
        },
        addServiceOptions: {
            id: "",
            type: "",
            serviceEndpoint: Array.of("", "", "", "",),
        },
        updateServiceOptions: {
            id: "",
            type: "",
            serviceEndpoint: Array.of("", "", "", "",),
        },
        removeServiceOptions: {
            id: "",
        }
    };

    static undefined(): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.Undefined,
        }
    }

    static addVerificationMethod(options: AddVerificationMethodOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.AddVerificationMethod,
            addVerificationMethodOptions: options,
        };
    }

    static updateVerificationMethod(options: UpdateVerificationMethodOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.UpdateVerificationMethod,
            updateVerificationMethodOptions: options,
        };
    }

    static removeVerificationMethod(options: RemoveVerificationMethodOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.RemoveVerificationMethod,
            removeVerificationMethodOptions: options,
        };
    }

    static addVerificationMethodRelation(options: AddVerificationMethodRelationOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.AddVerificationMethodRelation,
            addVerificationMethodRelationOptions: options,
        };
    }

    static removeVerificationMethodRelation(options: RemoveVerificationMethodRelationOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.RemoveVerificationMethodRelation,
            removeVerificationMethodRelationOptions: options,
        };
    }

    static addService(options: AddServiceOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.AddService,
            addServiceOptions: options,
        };
    }

    static updateService(options: UpdateServiceOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.UpdateService,
            updateServiceOptions: options,
        };
    }

    static removeService(options: RemoveServiceOptions): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.RemoveService,
            removeServiceOptions: options,
        };
    }

    static deactivate(): DIDUpdateOperation {
        return {
            ...this.defaultDIDUpdateOperation,
            operationType: OperationType.Deactivate,
        };
    }

    static padding(operations: DIDUpdateOperation[]): DIDUpdateOperation[] {
        const MAX_OPERATIONS = 32;
        if (operations.length > MAX_OPERATIONS) {
            throw new Error(`Cannot pad: input exceeds ${MAX_OPERATIONS} operations`);
        }
        return operations.concat(
            Array.from({ length: MAX_OPERATIONS - operations.length }, () => this.undefined())
        );
    }
    
}