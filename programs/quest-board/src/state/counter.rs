use anchor_lang::prelude::*;

#[account]
pub struct Counter {
  /// Bump nonce of the PDA. (1)
  pub bump: u8,

  /// Incremental counter used as an ID (seed) for the Quests. (8)
  pub post_counter: u64,

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

impl Counter {
  pub fn len() -> usize {
    8 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 128
  }
}
