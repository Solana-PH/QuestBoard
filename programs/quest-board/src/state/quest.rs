use anchor_lang::prelude::*;

#[account]
pub struct Quest {
  /// Bump nonce of the PDA. (1)
  pub bump: u8,

  /// unpublished: 0, open: 1, taken: 3, 
  /// complete: 5 (101: owner signed), 6 (110: offeree signed), 7 (111: both signed),
  /// dispute: 9 (1001: owner initiated), 10 (1010: offeree initiated), 11 (1011: both called),
  /// dispute resolved: 13 (1101: owner won), 14 (1110: offeree won), 15 (1111: draw). (1)
  pub status: u8,

  /// The owner of the Quest. (32)
  pub owner: Pubkey,

  /// The timestamp of the Quest creation. (8)
  pub timestamp: u64,

  /// The amount of governance token staked by the owner. (8)
  pub staked: u64,

  /// The minimum amount of governance token required to stake. (8)
  pub min_stake_required: u64,

  /// The amount of SOL paid for placement. (8)
  pub placement_paid: u64,

  /// SHA256 of the title and the description of the Quest. (32)
  pub details_hash: [u8; 32],

  /// The offeree of the Quest. (1 + 32)
  pub offeree: Option<Pubkey>,

  /// The amount of governance token staked by the offeree. (1 + 8)
  pub offeree_staked: Option<u64>,
}

impl Quest {
  pub fn len() -> usize {
    8 + 1 + 1 + 32 + 8 + 8 + 8 + 8 + 32 + (1 + 32) + (1 + 8)
  }
}