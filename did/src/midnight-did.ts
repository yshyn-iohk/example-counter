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

import { z } from "zod/v4-mini";

export enum MidnightNetwork {
  Undeployed = "undeployed",
  DevNet = "devnet",
  Testnet = "testnet",
  Mainnet = "mainnet",
}

//TODO: try to used existing enum
const NETWORKS = [
  MidnightNetwork.Undeployed,
  MidnightNetwork.DevNet,
  MidnightNetwork.Testnet,
  MidnightNetwork.Mainnet,
] as const;
const HEX_66_REGEX = /^[0-9a-f]{66}$/;

/**
 * Schema that validates and parses Midnight DIDs.
 * Format:
 * - did:midnight:<id>
 * - did:midnight:<network>:<id>
 */
const MidnightDIDStringSchema = z
  .string()
  .check(
    z.refine((raw) => {
      const parts = raw.split(":");
      if (parts.length === 3) {
        const [prefix, method, id] = parts;
        return (
          prefix === "did" && method === "midnight" && HEX_66_REGEX.test(id)
        );
      } else if (parts.length === 4) {
        const [prefix, method, network, id] = parts;
        return (
          prefix === "did" &&
          method === "midnight" &&
          NETWORKS.includes(network as MidnightNetwork) &&
          HEX_66_REGEX.test(id)
        );
      }
      return false;
    }, "Invalid MidnightDID string")
  )
  .brand("MidnightDIDString");

export type MidnightDIDString = z.infer<typeof MidnightDIDStringSchema>;

export function parseMidnightDIDString(input: unknown): MidnightDIDString {
  return MidnightDIDStringSchema.parse(input as string);
}

export const MidnightDIDSchema = z.pipe(
  MidnightDIDStringSchema,
  z.transform((raw) => {
    const parts = raw.split(":");
    const id = parts[parts.length - 1];
    const network =
      parts.length === 4
        ? (parts[2] as MidnightNetwork)
        : MidnightNetwork.Mainnet;

    return {
      raw,
      network,
      id
    };
  })
);

export type MidnightDID = z.infer<typeof MidnightDIDSchema>;

export function parseMidnightDID(input: unknown): MidnightDID {
  return MidnightDIDSchema.parse(input as string);
}

export function createMidnightDIDString(
  id: string,
  network: MidnightNetwork = MidnightNetwork.Mainnet
): MidnightDIDString {
  if (!HEX_66_REGEX.test(id)) {
    throw new Error(
      "Invalid DID ID format: must be 66 lowercase hex characters."
    );
  }
  return MidnightDIDStringSchema.parse(`did:midnight:${network}:${id}`);
}
