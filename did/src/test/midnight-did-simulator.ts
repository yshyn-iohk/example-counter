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
  VerificationMethodRelation,
  VerificationMethodType,
  VerificationMethod
} from "../managed/did/contract/index.cjs";

import { type MidnightDIDPrivateState, witnesses } from "../witnesses.js";

export class MidnightDIDSimulator {
  readonly contract: Contract<MidnightDIDPrivateState>;
  circuitContext: CircuitContext<MidnightDIDPrivateState>;

  constructor() {
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

  public addVerificationMethod(verificationMethod: VerificationMethod): Ledger {
    this.circuitContext = this.contract.impureCircuits.addVerificationMethod(
      this.circuitContext,
      verificationMethod
    ).context;
    return this.getLedger();
  }

  public updateVerificationMethod(
    verificationMethod: VerificationMethod
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.updateVerificationMethod(
      this.circuitContext,
      verificationMethod
    ).context;
    return this.getLedger();
  }

  public removeVerificationMethod(methodId: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.removeVerificationMethod(
      this.circuitContext,
      methodId
    ).context;
    return this.getLedger();
  }

  public addRelation(
    relation: VerificationMethodRelation,
    methodId: string
  ): Ledger {
    this.circuitContext =
      this.contract.impureCircuits.addVerificationMethodRelation(
        this.circuitContext,
        relation,
        methodId
      ).context;
    return this.getLedger();
  }

  public removeRelation(
    relation: VerificationMethodRelation,
    methodId: string
  ): Ledger {
    this.circuitContext =
      this.contract.impureCircuits.removeVerificationMethodRelation(
        this.circuitContext,
        relation,
        methodId
      ).context;
    return this.getLedger();
  }

  public deactivate(): Ledger {
    this.circuitContext = this.contract.impureCircuits.deactivate(
      this.circuitContext
    ).context;
    return this.getLedger();
  }
}
