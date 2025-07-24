import { describe, it, expect } from "vitest";

import { OperationBuilder } from "../ledger-operation-builder";
import {
    OperationType,
    VerificationMethodType,
    VerificationMethodRelation
} from "../managed/did/contract/index.cjs";

describe("OperationBuilder", () => {
    const sampleVM = {
        id: "key-1",
        type: VerificationMethodType.Ed25519VerificationKey2020,
        publicKey: new Uint8Array(32).fill(1),
    };

    it("should build addVerificationMethod operation", () => {
        const op = OperationBuilder.addVerificationMethod({ verificationMethod: sampleVM });
        expect(op.operationType).toBe(OperationType.AddVerificationMethod);
        expect(op.addVerificationMethodOptions.verificationMethod).toEqual(sampleVM);
    });

    it("should build updateVerificationMethod operation", () => {
        const op = OperationBuilder.updateVerificationMethod({ verificationMethod: sampleVM });
        expect(op.operationType).toBe(OperationType.UpdateVerificationMethod);
        expect(op.updateVerificationMethodOptions.verificationMethod).toEqual(sampleVM);
    });

    it("should build removeVerificationMethod operation", () => {
        const op = OperationBuilder.removeVerificationMethod({ id: "key-1" });
        expect(op.operationType).toBe(OperationType.RemoveVerificationMethod);
        expect(op.removeVerificationMethodOptions.id).toBe("key-1");
    });

    it("should build addVerificationMethodRelation operation", () => {
        const op = OperationBuilder.addVerificationMethodRelation({ relation: VerificationMethodRelation.Authentication, methodId: "key-1" });
        expect(op.operationType).toBe(OperationType.AddVerificationMethodRelation);
        expect(op.addVerificationMethodRelationOptions.relation).toBe(VerificationMethodRelation.Authentication);
        expect(op.addVerificationMethodRelationOptions.methodId).toBe("key-1");
    });

    it("should build removeVerificationMethodRelation operation", () => {
        const op = OperationBuilder.removeVerificationMethodRelation({ relation: VerificationMethodRelation.AssertionMethod, methodId: "key-2" });
        expect(op.operationType).toBe(OperationType.RemoveVerificationMethodRelation);
        expect(op.removeVerificationMethodRelationOptions.relation).toBe(VerificationMethodRelation.AssertionMethod);
        expect(op.removeVerificationMethodRelationOptions.methodId).toBe("key-2");
    });

    it("should build addService operation", () => {
        const service = { id: "svc-1", type: "LinkedDomains", serviceEndpoint: ["https://example.com"] };
        const op = OperationBuilder.addService(service);
        expect(op.operationType).toBe(OperationType.AddService);
        expect(op.addServiceOptions).toEqual(service);
    });

    it("should build updateService operation", () => {
        const service = { id: "svc-1", type: "LinkedDomains", serviceEndpoint: ["https://example.org"] };
        const op = OperationBuilder.updateService(service);
        expect(op.operationType).toBe(OperationType.UpdateService);
        expect(op.updateServiceOptions).toEqual(service);
    });

    it("should build removeService operation", () => {
        const op = OperationBuilder.removeService({ id: "svc-1" });
        expect(op.operationType).toBe(OperationType.RemoveService);
        expect(op.removeServiceOptions.id).toBe("svc-1");
    });

    it("should build deactivate operation", () => {
        const op = OperationBuilder.deactivate();
        expect(op.operationType).toBe(OperationType.Deactivate);
    });
});