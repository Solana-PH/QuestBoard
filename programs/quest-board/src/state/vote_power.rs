use anchor_lang::prelude::*;

#[account]
pub struct VotePower {
  /// Bump nonce of the PDA. (1)
  pub bump: u8,

  // todo: unstake slot timestamp, stake slot timestamp, ATA

}