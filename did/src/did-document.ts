import { z } from "zod/v4-mini";

/** DID URL schema */
export const DIDURLSchema = z
  .string()
  .check(
    z.startsWith("did:"),
    z.minLength(5),
    z.refine((val) => val.split(":").length >= 3, "Invalid DID URL format")
  )
  .brand("DIDURL");
export type DIDURL = z.infer<typeof DIDURLSchema>;

/** DID schema (no path/query/fragment) */
export const DIDSchema = z
  .string()
  .check(
    z.startsWith("did:"),
    z.minLength(5),
    z.refine(
      (val) => val.split(":").length >= 3 && !/[\/?#]/.test(val),
      "Invalid DID format"
    )
  )
  .brand("DID");
export type DID = z.infer<typeof DIDSchema>;

/** Multibase public key */
export const PublicKeyMultibaseSchema = z
  .string()
  .check(
    z.minLength(2),
    z.regex(/^[0-9A-Za-z]/),
    z.refine(() => true, "Invalid multibase format")
  )
  .brand("PublicKeyMultibase");
export type PublicKeyMultibase = z.infer<typeof PublicKeyMultibaseSchema>;

/** Verification Method Types */
export enum VerificationMethodType {
  Undefined = "Undefined",
  Ed25519VerificationKey2020 = "Ed25519VerificationKey2020",
  RedJubJubVerificationKey2025 = "RedJubJubVerificationKey2025"
}
export const VerificationMethodTypeSchema = z.enum(VerificationMethodType);

/** Verification Method */
export const VerificationMethodSchema = z.object({
  id: DIDURLSchema,
  type: VerificationMethodTypeSchema,
  controller: DIDSchema,
  publicKeyMultibase: PublicKeyMultibaseSchema
});
export type VerificationMethod = z.infer<typeof VerificationMethodSchema>;

/** Verification Method Relation */
export enum VerificationMethodRelationType {
  Undefined = "Undefined",
  Authentication = "Authentication",
  AssertionMethod = "AssertionMethod",
  KeyAgreement = "KeyAgreement",
  CapabilityInvocation = "CapabilityInvocation",
  CapabilityDelegation = "CapabilityDelegation"
}

export const VerificationMethodRelationTypeSchema = z.enum(
  VerificationMethodRelationType
);

export type VerificationMethodRelation = z.infer<
  typeof VerificationMethodRelationTypeSchema
>;

/** Service Endpoint */
export const ServiceEndpointSchema = z.union([z.string(), z.array(z.string())]);
export type ServiceEndpoint = z.infer<typeof ServiceEndpointSchema>;

/** Service ID (not enforcing .url()) */
export const URISchema = z.string();

/** Service */
export const ServiceSchema = z.object({
  id: URISchema,
  type: z.union([z.string(), z.array(z.string())]),
  serviceEndpoint: ServiceEndpointSchema
});
export type Service = z.infer<typeof ServiceSchema>;

/** DID Document */
export const DIDDocumentSchema = z.looseObject({
  "@context": z.union([z.string(), z.array(z.string())]),
  id: DIDSchema,
  alsoKnownAs: z.nullish(z.array(DIDSchema)),
  controller: z.nullish(z.union([DIDSchema, z.array(DIDSchema)])),
  verificationMethod: z.nullish(z.array(VerificationMethodSchema)),
  authentication: z.nullish(z.array(z.string())),
  assertionMethod: z.nullish(z.array(z.string())),
  keyAgreement: z.nullish(z.array(z.string())),
  capabilityInvocation: z.nullish(z.array(z.string())),
  capabilityDelegation: z.nullish(z.array(z.string())),
  service: z.nullish(z.array(ServiceSchema))
});
export type DIDDocument = z.infer<typeof DIDDocumentSchema>;

/** DID Document Metadata */
export const DIDDocumentMetadataSchema = z.looseObject({
  created: z.nullish(z.string()),
  updated: z.nullish(z.string()),
  deactivated: z.nullish(z.boolean()),
  nextUpdate: z.nullish(z.string()),
  nextVersionId: z.nullish(z.string()),
  equivalentId: z.nullish(z.array(z.string())),
  canonicalId: z.nullish(z.string())
});
export type DIDDocumentMetadata = z.infer<typeof DIDDocumentMetadataSchema>;

export const KnownDIDMediaTypesSchema = z.enum([
  "application/did+ld+json",
  "application/did+json",
  "application/ld+json",
  "application/json"
]);

/** Known DID Media Types */
export type KnownDIDMediaTypes = z.infer<typeof KnownDIDMediaTypesSchema>;

/** DID Resolution Result */
export const DIDResolutionResultSchema = z.looseObject({
  "@context": z.nullish(z.union([z.string(), z.array(z.string())])),
  didDocument: z.nullish(DIDDocumentSchema),
  didDocumentMetadata: DIDDocumentMetadataSchema,
  didResolutionMetadata: z.object({
    contentType: z.nullish(KnownDIDMediaTypesSchema),
    error: z.nullish(z.string())
  })
});
export type DIDResolutionResult = z.infer<typeof DIDResolutionResultSchema>;

/** Parsing Helpers */
export const parseDIDDocument = (input: unknown) =>
  DIDDocumentSchema.parse(input);
export const parseDIDURL = (input: unknown) => DIDURLSchema.parse(input);
export const parseDID = (input: unknown) => DIDSchema.parse(input);
export const parseVerificationMethod = (input: unknown) =>
  VerificationMethodSchema.parse(input);
export const parseService = (input: unknown) => ServiceSchema.parse(input);
export const parseDIDResolutionResult = (input: unknown) =>
  DIDResolutionResultSchema.parse(input);
export const parseVerificationMethodType = (input: unknown) =>
  VerificationMethodTypeSchema.parse(input);

/** Creation Helpers */
export function createVerificationMethod(params: {
  id: string;
  type: VerificationMethodType;
  controller: string;
  publicKeyMultibase: string;
}): VerificationMethod {
  return VerificationMethodSchema.parse(params);
}

export function createService(params: {
  id: string;
  type: string | string[];
  serviceEndpoint: ServiceEndpoint;
}): Service {
  return ServiceSchema.parse(params);
}

export function createDIDDocument(params: {
  id: string;
  context?: string | string[];
  alsoKnownAs?: string[];
  controller?: string | string[];
  verificationMethod?: VerificationMethod[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: Service[];
}): DIDDocument {
  return DIDDocumentSchema.parse({
    "@context": params.context ?? "https://www.w3.org/ns/did/v1",
    id: params.id,
    alsoKnownAs: params.alsoKnownAs ?? null,
    controller: params.controller ?? null,
    verificationMethod: params.verificationMethod ?? null,
    authentication: params.authentication ?? null,
    assertionMethod: params.assertionMethod ?? null,
    keyAgreement: params.keyAgreement ?? null,
    capabilityInvocation: params.capabilityInvocation ?? null,
    capabilityDelegation: params.capabilityDelegation ?? null,
    service: params.service ?? null
  });
}
/**
 * Converts a hex string to a PublicKeyMultibase using base16 by prepending 'f'.
 */
export function hexToPublicKeyMultibase(hex: string): PublicKeyMultibase {
  return `f${hex}` as PublicKeyMultibase;
}

/**
 * Converts a PublicKeyMultibase (base16) to a hex string by stripping the leading 'f'.
 */
export function publicKeyMultibaseToHex(multibase: PublicKeyMultibase): string {
  if (!multibase.startsWith("f")) {
    throw new Error('Unsupported multibase, expected "f" (base16)');
  }
  return multibase.slice(1);
}

/**
 * Converts a PublicKeyMultibase (base16, starting with 'f') to a Uint8Array.
 * @param multibase - PublicKeyMultibase string.
 * @returns Uint8Array of the decoded public key bytes.
 */
export function publicKeyMultibaseToBytes(
  multibase: PublicKeyMultibase
): Uint8Array {
  if (!multibase.startsWith("f")) {
    throw new Error('Unsupported multibase, expected "f" (base16)');
  }
  return Uint8Array.from(Buffer.from(multibase.slice(1), "hex"));
}

/**
 * Converts a Uint8Array (or ArrayBufferLike) to a PublicKeyMultibase string using base16 (prepend 'f').
 * @param bytes - Uint8Array or ArrayBufferLike representing the public key.
 * @returns PublicKeyMultibase string.
 */
export function bytesToPublicKeyMultibase(
  bytes: Uint8Array | ArrayBufferLike
): string {
  const uint8Bytes =
    bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const hex = Buffer.from(uint8Bytes).toString("hex");
  return `f${hex}`;
}
