import { deserializer, type Schema } from './deserializer'

const schema: Schema[] = [
  { name: 'discriminator', type: 'u64' },
  { name: 'bump', type: 'u8' },
  { name: 'status', type: 'u8' },
  { name: 'owner', type: 'pubkey' },
  { name: 'timestamp', type: 'u64' },
  { name: 'staked', type: 'u64' },
  { name: 'minStakeRequired', type: 'u64' },
  { name: 'placementPaid', type: 'u64' },
  { name: 'detailsHash', type: 'pubkey' },
  { name: 'id', type: 'pubkey' },
  { name: 'acceptedTimestamp', type: 'u64', optional: true },
  { name: 'offeree', type: 'pubkey', optional: true },
  { name: 'offereeStaked', type: 'u64', optional: true },
  { name: 'offereeProposalHash', type: 'pubkey', optional: true },
  { name: 'ownerVotes', type: 'u64', optional: true },
  { name: 'offereeVotes', type: 'u64', optional: true },
  { name: 'abstainedVotes', type: 'u64', optional: true },
]

export interface QuestData {
  discriminator: BigInt
  bump: number
  status: number
  owner: string
  timestamp: BigInt
  staked: BigInt
  minStakeRequired: BigInt
  placementPaid: BigInt
  detailsHash: string
  id: string
  acceptedTimestamp: BigInt
  offeree: string
  offereeStaked: BigInt
  offereeProposalHash: string
  ownerVotes: BigInt
  offereeVotes: BigInt
  abstainedVotes: BigInt
}

export function decodeQuestData(data: Uint8Array) {
  return deserializer(data, schema) as QuestData
}
