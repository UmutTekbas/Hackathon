import { isAddress, zeroAddress, type Address } from "viem";

const configuredAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
export const isContractConfigured = Boolean(configuredAddress && isAddress(configuredAddress));
export const proofStreamAddress = (isContractConfigured ? configuredAddress : zeroAddress) as Address;

export const proofStreamAbi = [
  {
    type: "function", name: "createSession", stateMutability: "nonpayable",
    inputs: [{ name: "title", type: "string" }, { name: "pricePerMinute", type: "uint256" }],
    outputs: [{ name: "sessionId", type: "uint256" }]
  },
  {
    type: "function", name: "deposit", stateMutability: "payable",
    inputs: [{ name: "sessionId", type: "uint256" }], outputs: []
  },
  {
    type: "function", name: "startSession", stateMutability: "nonpayable",
    inputs: [{ name: "sessionId", type: "uint256" }], outputs: []
  },
  {
    type: "function", name: "endSession", stateMutability: "nonpayable",
    inputs: [{ name: "sessionId", type: "uint256" }], outputs: []
  },
  {
    type: "function", name: "attestSession", stateMutability: "nonpayable",
    inputs: [{ name: "sessionId", type: "uint256" }], outputs: []
  },
  {
    type: "function", name: "nextSessionId", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function", name: "ATTESTATION_TIMEOUT", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function", name: "tutorReputation", stateMutability: "view",
    inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function", name: "getSession", stateMutability: "view",
    inputs: [{ name: "sessionId", type: "uint256" }],
    outputs: [{
      name: "", type: "tuple", components: [
        { name: "tutor", type: "address" },
        { name: "student", type: "address" },
        { name: "title", type: "string" },
        { name: "pricePerMinute", type: "uint256" },
        { name: "depositedAmount", type: "uint256" },
        { name: "startedAt", type: "uint256" },
        { name: "endedAt", type: "uint256" },
        { name: "earnedAmount", type: "uint256" },
        { name: "refundedAmount", type: "uint256" },
        { name: "studentAttested", type: "bool" },
        { name: "tutorAttested", type: "bool" },
        { name: "proofIssued", type: "bool" },
        { name: "status", type: "uint8" }
      ]
    }]
  },
  {
    type: "event", name: "SessionCreated", inputs: [
      { name: "sessionId", type: "uint256", indexed: true },
      { name: "tutor", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "pricePerMinute", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event", name: "SessionEnded", inputs: [
      { name: "sessionId", type: "uint256", indexed: true },
      { name: "endedAt", type: "uint256", indexed: false },
      { name: "earnedAmount", type: "uint256", indexed: false },
      { name: "refundedAmount", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event", name: "SkillProofMinted", inputs: [
      { name: "student", type: "address", indexed: true },
      { name: "tutor", type: "address", indexed: true },
      { name: "sessionId", type: "uint256", indexed: true },
      { name: "subject", type: "string", indexed: false },
      { name: "duration", type: "uint256", indexed: false }
    ]
  }
] as const;

export type ProofSession = {
  tutor: Address;
  student: Address;
  title: string;
  pricePerMinute: bigint;
  depositedAmount: bigint;
  startedAt: bigint;
  endedAt: bigint;
  earnedAmount: bigint;
  refundedAmount: bigint;
  studentAttested: boolean;
  tutorAttested: boolean;
  proofIssued: boolean;
  status: number;
};

export const statusLabel = ["Open", "Funded", "Streaming", "Awaiting proof"] as const;
