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

import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import path from 'path';
import * as api from '../api';
import { DeployedMidnightDIDContract, MidnightDIDContract, type MidnightDIDProviders } from '../common-types';
import { DIDOperation, DIDOperationType, MidnightDIDString, parseDIDURL, createMidnightDIDString, VerificationMethodType, parsePublicKeyMultibase, parseDIDKeyID, VerificationMethodRelation, VerificationMethodRelationType, parseContractAddress, hexToPublicKeyMultibase, OperationBuilder } from '@midnight-ntwrk/did-contract';
import { currentDir } from '../config';
import { createLogger } from '../logger-utils';
import { TestEnvironment } from './commons';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { log } from 'console';

const logDir = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
const logger = await createLogger(logDir);

describe('API', () => {
  let testEnvironment: TestEnvironment;
  let wallet: Wallet & Resource;
  let providers: MidnightDIDProviders;
  let contract: DeployedMidnightDIDContract;
  let contractAddress: string;
  let didString: MidnightDIDString;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      wallet = await testEnvironment.getWallet();
      providers = await api.configureProviders(wallet, testConfiguration.dappConfig);
    },
    1000 * 60 * 45 *  10,
  );

  afterAll(async () => {
    await testEnvironment.saveWalletCache();
    await testEnvironment.shutdown();
  });

  it('should deploy the contract with empty state [@slow]', async () => {
    contract = await api.createDID(providers, {});
    expect(contract).not.toBeNull();

    // contractAddress = parseContractAddress(contract.deployTxData.public.contractAddress);
    // didString = createMidnightDIDString(contractAddress, api.midnightNetwork);

    logger.info(`!!! contract address ${contract.deployTxData.public.contractAddress}`);
    contractAddress = parseContractAddress(contract.deployTxData.public.contractAddress);
    didString = createMidnightDIDString(contractAddress, api.midnightNetwork);


    logger.info(`MidnightDIDString is: ${didString}`);

    const didLedger = await api.getMidnightDIDLedgerState(providers, contractAddress);
    expect(didLedger?.active).toBeTruthy;
    //TODO: id is zero byte array
    //expect(didLedger?.id).toEqual(didContractAddress);
    expect(didLedger?.verificationMethods.isEmpty).toBeTruthy;
    expect(didLedger?.assertionMethodRelation.isEmpty).toBeTruthy;
    expect(didLedger?.authenticationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.capabilityDelegationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.capabilityInvocationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.services.isEmpty).toBeTruthy;
  });

  it('should update DID with the verification method and resolve final document', async () => {
    const methodId = parseDIDKeyID(`${didString}#key-1`);
    const publicKeyHex = "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
    const publicKeyMultibase = parsePublicKeyMultibase(hexToPublicKeyMultibase(publicKeyHex));

    const methodId2 = parseDIDKeyID(`${didString}#key-2`);
    const publicKeyHex2 = "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a1";
    const publicKeyMultibase2 = parsePublicKeyMultibase(hexToPublicKeyMultibase(publicKeyHex2));

    const operations: DIDOperation[] = [
      {
        type: DIDOperationType.AddVerificationMethod,
        verificationMethod: {
          id: methodId,
          type: VerificationMethodType.RedJubJubVerificationKey2025,
          controller: didString,
          publicKeyMultibase: publicKeyMultibase
        }
      },
      {
        type: DIDOperationType.AddVerificationMethod,
        verificationMethod: {
          id: methodId2,
          type: VerificationMethodType.RedJubJubVerificationKey2025,
          controller: didString,
          publicKeyMultibase: publicKeyMultibase2
        }
      },
    ];

    const result = await api.updateDID(contract, operations);
    expect(result.txId).toMatch(/[0-9a-f]{64}/);

    const didDoc = await api.resolveDID(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDoc, null, 2)}`);

    expect(didDoc?.verificationMethod).not.toBeNull()

    const insertedVerificationMethod = didDoc?.verificationMethod?.find(vm => vm.id === methodId);  
    expect(insertedVerificationMethod).not.toBeNull;
    expect(insertedVerificationMethod?.type).toEqual(VerificationMethodType.RedJubJubVerificationKey2025);
  });

  it('should update DID with the verification relation and resolve final document', async () => {
    const methodId = parseDIDKeyID(`${didString}#key-1`);

    const operations: DIDOperation[] = [
      {
        type: DIDOperationType.AddVerificationMethodRelation,
        relation: VerificationMethodRelationType.Authentication,
        methodId: methodId
      },
    ];

    const result = await api.updateDID(contract, operations);
    expect(result.txId).toMatch(/[0-9a-f]{64}/);

    const didDoc = await api.resolveDID(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDoc, null, 2)}`);
    expect(didDoc?.authentication?.some(
      authenticationMethodId => authenticationMethodId === methodId)).toBe(true);
  });

  it('should update DID with the new verification method using the batch operation', async () => {
    const methodId = parseDIDKeyID(`${didString}#key-2`);
    const publicKeyHex = "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1b4";
    const publicKeyMultibase = parsePublicKeyMultibase(hexToPublicKeyMultibase(publicKeyHex));
    const operations: DIDOperation[] = [
      {
        type: DIDOperationType.AddVerificationMethod,
        verificationMethod: {
          id: methodId,
          type: VerificationMethodType.Ed25519VerificationKey2020,
          controller: didString,
          publicKeyMultibase: publicKeyMultibase
        }
      },
      // {
      //   type: DIDOperationType.AddVerificationMethodRelation,
      //   relation: VerificationMethodRelationType.AssertionMethod,
      //   methodId: methodId
      // },
    ];

    const result = await api.updateDID(contract, operations);
    expect(result.txId).toMatch(/[0-9a-f]{64}/);

    const didDoc = await api.resolveDID(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDoc, null, 2)}`);

    expect(didDoc?.verificationMethod).not.toBeNull()

    const insertedVerificationMethod = didDoc?.verificationMethod?.find(vm => vm.id === methodId);  
    expect(insertedVerificationMethod).not.toBeNull;
    expect(insertedVerificationMethod?.type).toEqual(VerificationMethodType.Ed25519VerificationKey2020);
  });

it('should update DID with the new verification method using the batch operation (2)', async () => {
    const methodId = parseDIDKeyID(`${didString}#key-2`);
    const publicKeyHex = "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1b4";
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
        methodId: methodId
      },
    ];

    const result = await api.updateDID(contract, operations);
    expect(result.txId).toMatch(/[0-9a-f]{64}/);

    const didDoc = await api.resolveDID(providers, contract);
    logger.info(`DIDDocument JSON: ${JSON.stringify(didDoc, null, 2)}`);

    expect(didDoc?.verificationMethod).not.toBeNull()

    const insertedVerificationMethod = didDoc?.verificationMethod?.find(vm => vm.id === methodId);  
    expect(insertedVerificationMethod).not.toBeNull;
    expect(insertedVerificationMethod?.type).toEqual(VerificationMethodType.Ed25519VerificationKey2020);
  });
});
