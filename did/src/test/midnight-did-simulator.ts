import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  constructorContext
} from "@midnight-ntwrk/compact-runtime";

import {
  Contract,
  type Ledger,
  ledger,
  DIDUpdateOperation
} from "../managed/did/contract/index.cjs";

import { OperationBuilder } from "../ledger-operation-builder";

import { DIDDocumentToLedger } from "../ledger-mapping";

import { type MidnightDIDPrivateState, witnesses } from "../witnesses.js";

export class MidnightDIDSimulator {
  readonly contract: Contract<MidnightDIDPrivateState>;
  circuitContext: CircuitContext<MidnightDIDPrivateState>;

  constructor(operations: Array<DIDUpdateOperation> = []) {
    if (operations.length > 32) {
      throw new Error("Maximum number of DID operations exceeded: 32");
    }
    this.contract = new Contract<MidnightDIDPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState
    } = this.contract.initialState(constructorContext({}, "0".repeat(64)));
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress()
      )
    };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
  }

  public getPrivateState(): MidnightDIDPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public applyOperation(operation: DIDUpdateOperation): Ledger {
    return this.applyOperations(Array.of(operation));
  }

  public applyOperations(operations: Array<DIDUpdateOperation>): Ledger {
    const ledgerOperations = OperationBuilder.padding(operations);
    this.circuitContext = this.contract.impureCircuits.applyOperations(
      this.circuitContext,
      ledgerOperations
    ).context;
    return this.getLedger();
  }
}
