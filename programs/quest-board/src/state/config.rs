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

  /// Slots before the decay fee takes effect, ideally after a month. (8)
  pub decay_start: u64,

  /// Vote threshold for dispute resolution. (8)
  pub vote_threshold: u64,

  /// Duration of the dispute resolution period, in slots (block height). (8)
  pub dispute_duration: u64,

  /// Slots before being able to vote on a dispute. (8)
  pub staked_vote_power_start: u64,

  /// Interval in slots to unlock a portion of the staked votes until depletion. (8)
  pub unstaked_vote_unlock_interval: u64,

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
    8 + 1 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 128
  }
}
