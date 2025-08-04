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
import { type MidnightDIDProviders } from '../common-types';
import { currentDir } from '../config';
import { createLogger } from '../logger-utils';
import { TestEnvironment } from './commons';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const logDir = path.resolve(currentDir, '..', 'logs', 'tests', `${new Date().toISOString()}.log`);
const logger = await createLogger(logDir);

describe('API', () => {
  let testEnvironment: TestEnvironment;
  let wallet: Wallet & Resource;
  let providers: MidnightDIDProviders;

  beforeAll(
    async () => {
      api.setLogger(logger);
      testEnvironment = new TestEnvironment(logger);
      const testConfiguration = await testEnvironment.start();
      wallet = await testEnvironment.getWallet();
      providers = await api.configureProviders(wallet, testConfiguration.dappConfig);
    },
    1000 * 60 * 45,
  );

  afterAll(async () => {
    await testEnvironment.saveWalletCache();
    await testEnvironment.shutdown();
  });

  it('should deploy the contract with empty state [@slow]', async () => {
    const didContract = await api.createDID(providers, {});
    expect(didContract).not.toBeNull();

    const didContractAddress = didContract.deployTxData.public.contractAddress;

    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const didLedger = await api.getMidnightDIDLedgerState(providers, didContractAddress);
    expect(didLedger?.active).toBeTruthy;
    //TODO: id is zero byte array
    //expect(didLedger?.id).toEqual(didContractAddress);
    expect(didLedger?.verificationMethods.isEmpty).toBeTruthy;
    expect(didLedger?.assertionMethodRelation.isEmpty).toBeTruthy;
    expect(didLedger?.authenticationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.capabilityDelegationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.capabilityInvocationRelation.isEmpty).toBeTruthy;
    expect(didLedger?.services.isEmpty).toBeTruthy;

    // await new Promise((resolve) => setTimeout(resolve, 2000));
    // const response = await api.increment(counterContract);
    // expect(response.txHash).toMatch(/[0-9a-f]{64}/);
    // expect(response.blockHeight).toBeGreaterThan(BigInt(0));

    // const counterAfter = await api.displayCounterValue(providers, counterContract);
    // expect(counterAfter.counterValue).toEqual(BigInt(1));
    // expect(counterAfter.contractAddress).toEqual(counter.contractAddress);
  });
});
