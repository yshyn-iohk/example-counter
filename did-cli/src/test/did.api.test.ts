// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  ContractAddress as MidnightContractAddress,
  createMidnightDIDString,
  CurveType,
  DIDOperation,
  DIDOperationType,
  DIDStringSchema,
  hexToPublicKeyMultibase,
  KeyType,
  MidnightDIDSchema,
  MidnightDIDString,
  OperationBuilder,
  parseContractAddress,
  parseDIDKeyID,
  parseDIDURL,
  parseMidnightDID,
  parseMidnightDIDString,
  parsePublicKeyMultibase,
  VerificationMethodRelation,
  VerificationMethodRelationType,
  VerificationMethodType,
} from '@midnight-ntwrk/did-contract';
import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { log } from 'console';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as api from '../api';
import { DeployedMidnightDIDContract, MidnightDIDContract, type MidnightDIDProviders } from '../common-types';
import { currentDir } from '../config';
import { BigIntReplacer, createLogger } from '../logger-utils';
import { TestEnvironment } from './commons';

const logDir = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
const logger = await createLogger(logDir);

describe('Midnight DID', () => {
  let testEnvironment: TestEnvironment;
  let wallet: Wallet & Resource;
  let providers: MidnightDIDProviders;
  let contract: DeployedMidnightDIDContract;
  let contractAddress: MidnightContractAddress;
  let didString: MidnightDIDString;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      wallet = await testEnvironment.getWallet();
      providers = await api.configureProviders(wallet, testConfiguration.dappConfig);
    },
    1000 * 60 * 45 * 10,
  );

  afterAll(async () => {
    await testEnvironment.saveWalletCache();
    await testEnvironment.shutdown();
  });

  it('should be published by the contract to the Midnight blockchain with empty state [@slow]', async () => {
    contract = await api.createDID(providers, {});
    expect(contract).not.toBeNull();

    contractAddress = parseContractAddress(contract.deployTxData.public.contractAddress);
    logger.info(`MidnightDID contract address: ${contractAddress}`);

    didString = createMidnightDIDString(contractAddress, api.midnightNetwork);
    logger.info(`MidnightDID ID is: ${didString}`);

    const didLedger = await api.getMidnightDIDLedgerState(providers, contractAddress);
    expect(didLedger?.active).toBeTruthy;
    expect(didLedger?.verificationMethods.isEmpty).toBeTruthy;
    expect(didLedger?.assertionMethodRelation.isEmpty).toBeTruthy;
    expect(didLedger?.authenticationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.capabilityDelegationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.capabilityInvocationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.services.isEmpty).toBeTruthy;
  });

  it('should contain the reference to the DID Core specificaiton 1.0', async () => {
    const didDoc = await api.resolve(providers, contract);

    expect(didDoc).toBeTruthy;
    expect(didDoc?.['@context']).toBeInstanceOf(Array);
    expect(didDoc?.['@context'][0]).toBe('https://www.w3.org/ns/did/v1');
  });

  it('should contain the `id` property matching the pattern: `did:midnight<network_id>:<contract_address>`', async () => {
    const didDoc = await api.resolve(providers, contract);

    expect(didDoc).toBeTruthy;
    expect(typeof didDoc?.id).toBe('string');
    expect(() => DIDStringSchema.parse(didDoc?.id)).not.toThrow();
    expect(() => MidnightDIDSchema.parse(didDoc?.id)).not.toThrow();

    const midnightDIDString = parseMidnightDIDString(didDoc?.id);
    const midnightDID = parseMidnightDID(midnightDIDString);

    expect(midnightDID.network).toBe(api.midnightNetwork.toString());
    expect(midnightDID.id).toBe(contractAddress);
  });

  it(`should be updated the verification method with ${VerificationMethodType.RedJubJubVerificationKey2025} public key`, async () => {
    const methodId = parseDIDKeyID(`${didString}#key-1`);
    const publicKeyHex = 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2';
    const publicKeyMultibase = parsePublicKeyMultibase(hexToPublicKeyMultibase(publicKeyHex));

    const operations: DIDOperation[] = [
      {
        type: DIDOperationType.AddVerificationMethod,
        verificationMethod: {
          id: methodId,
          type: VerificationMethodType.RedJubJubVerificationKey2025,
          controller: didString,
          publicKeyMultibase: publicKeyMultibase,
          publicKeyJwk: {
            kty: KeyType.EC,
            crv: CurveType.ed25519,
            x: 42n,
            y: 84n,
          },
        },
      },
    ];

    await api.update(contract, operations);

    const didDocument = await api.resolve(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDocument, BigIntReplacer, 2)}`);

    expect(didDocument?.verificationMethod).not.toBeNull();

    const insertedVerificationMethod = didDocument?.verificationMethod?.find((vm) => vm.id === methodId);

    expect(insertedVerificationMethod).not.toBeNull;
    expect(insertedVerificationMethod?.type).toEqual(VerificationMethodType.RedJubJubVerificationKey2025);
    expect(insertedVerificationMethod?.controller).toEqual(didString);
    expect(insertedVerificationMethod?.publicKeyMultibase).toEqual(publicKeyMultibase);
  });

  it('should be updated with the verification relation', async () => {
    const methodId = parseDIDKeyID(`${didString}#key-1`);

    const operations: DIDOperation[] = [
      {
        type: DIDOperationType.AddVerificationMethodRelation,
        relation: VerificationMethodRelationType.Authentication,
        methodId: methodId,
      },
    ];

    const result = await api.update(contract, operations);

    const didDoc = await api.resolve(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDoc, BigIntReplacer, 2)}`);
    expect(didDoc?.authentication?.some((authenticationMethodId) => authenticationMethodId === methodId)).toBe(true);
  });

  it('should update DID with the new verification method using the batch operation', async () => {
    const methodId = parseDIDKeyID(`${didString}#key-2`);
    const publicKeyHex = 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1b4';
    const publicKeyMultibase = parsePublicKeyMultibase(hexToPublicKeyMultibase(publicKeyHex));
    const operations: DIDOperation[] = [
      {
        type: DIDOperationType.AddVerificationMethod,
        verificationMethod: {
          id: methodId,
          type: VerificationMethodType.Ed25519VerificationKey2020,
          controller: didString,
          publicKeyMultibase: publicKeyMultibase,
          publicKeyJwk: {
            kty: KeyType.EC,
            crv: CurveType.ed25519,
            x: 42n,
            y: 84n,
          },
        },
      },
      // {
      //   type: DIDOperationType.AddVerificationMethodRelation,
      //   relation: VerificationMethodRelationType.AssertionMethod,
      //   methodId: methodId
      // },
    ];

    const result = await api.update(contract, operations);
    expect(result.txId).toMatch(/[0-9a-f]{64}/);

    const didDoc = await api.resolve(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDoc, BigIntReplacer, 2)}`);

    expect(didDoc?.verificationMethod).not.toBeNull();

    const insertedVerificationMethod = didDoc?.verificationMethod?.find((vm) => vm.id === methodId);
    expect(insertedVerificationMethod).not.toBeNull;
    expect(insertedVerificationMethod?.type).toEqual(VerificationMethodType.Ed25519VerificationKey2020);
  });

  it('should update DID with the new verification method using the batch operation (2)', async () => {
    const methodId = parseDIDKeyID(`${didString}#key-2`);
    const publicKeyHex = 'f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1b4';
    const publicKeyMultibase = parsePublicKeyMultibase(hexToPublicKeyMultibase(publicKeyHex));
    const operations: DIDOperation[] = [
      // {
      //   type: DIDOperationType.AddVerificationMethod,
      //   verificationMethod: {
      //     id: methodId,
      //     type: VerificationMethodType.Ed25519VerificationKey2020,
      //     controller: didString,
      //     publicKeyMultibase: publicKeyMultibase
      //   }
      // },
      {
        type: DIDOperationType.AddVerificationMethodRelation,
        relation: VerificationMethodRelationType.AssertionMethod,
        methodId: methodId,
      },
    ];

    const result = await api.update(contract, operations);
    expect(result.txId).toMatch(/[0-9a-f]{64}/);

    const didDoc = await api.resolve(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDoc, BigIntReplacer, 2)}`);

    expect(didDoc?.verificationMethod).not.toBeNull();

    const insertedVerificationMethod = didDoc?.verificationMethod?.find((vm) => vm.id === methodId);
    expect(insertedVerificationMethod).not.toBeNull;
    expect(insertedVerificationMethod?.type).toEqual(VerificationMethodType.Ed25519VerificationKey2020);

    //use this code to freeze the docker environment setup
    // await new Promise(resolve => setTimeout(resolve, 50 * 60 * 1000));
  });
});
