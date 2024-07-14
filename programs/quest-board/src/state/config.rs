use anchor_lang::prelude::*;

#[account]
pub struct Config {
  /// Bump nonce of the PDA. (1)
  pub bump: u8,

  /// The authority that is permitted to update this state. (32)
  pub authority: Pubkey,

  /// The wallet that stores the collected fees. (32)
  pub treasury: Pubkey,

  /// Governance token to use. (32)
  pub token: Pubkey,

  /// Amount of fee being collected when a Quest is created. (8)
  pub base_fee: u64,

  /// Amount of fee being collected when a Quest lingers for more than 1 month, daily. (8)
  pub decay_fee: u64,

  /// Number of posts (Quests) open / available. (8)
  pub posts_open: u64,

  /// Number of posts (Quests) taken. (8)
  pub posts_taken: u64,

  /// Number of posts (Quests) completed. Does not count resolved posts. (8)
  pub posts_completed: u64,

  /// Number of posts (Quests) in dispute. (8)
  pub posts_in_dispute: u64,

  /// Number of posts (Quests) resolved from dispute. (8)
  pub posts_resolved: u64,

  /// Unused reserved byte space for future additive changes. (128)
  pub _reserved: [u8; 128],
}

impl Config {
  pub fn len() -> usize {
    8 + 1 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 128
  }
}
