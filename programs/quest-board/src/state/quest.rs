use anchor_lang::prelude::*;

#[account]
pub struct Quest {
  /// Bump nonce of the PDA. (1)
  pub bump: u8,

  /// unpublished: 0, 
  /// open: 1, 
  /// taken: 3, 
  /// complete: 7,
  /// dispute: 9,
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

  /// ID used to define the seed. (32)
  pub id: u64,

  /// The slot when the Quest was accepted. (1 + 8)
  pub accepted_timestamp: Option<u64>,

  /// The offeree of the Quest. (1 + 32)
  pub offeree: Option<Pubkey>,

  /// The amount of governance token staked by the offeree. (1 + 8)
  pub offeree_staked: Option<u64>,

  /// The hash of the proposal made by the offeree. (1 + 32)
  pub offeree_proposal_hash: Option<[u8; 32]>,

  /// Votes for owner. (1 + 8)
  pub owner_votes: Option<u64>,

  /// Votes for offeree. (1 + 8)
  pub offeree_votes: Option<u64>,

  /// Votes for abstained (resulting to draw). (1 + 8)
  pub abstained_votes: Option<u64>,
}

impl Quest {
  pub fn len() -> usize {
    8 + 1 + 1 + 32 + 8 + 8 + 8 + 8 + 32 + 8 + (1 + 8) + (1 + 32) + (1 + 8) + (1 + 32) + (1 + 8) + (1 + 8) + (1 + 8)
  }

  pub fn close_account(&self) -> Result<()> {

    // todo: calculate placement decay fee, for now, return 100% of the placement fee
    // todo: possibly pass config (treasury) and owner

    Ok(())
  }

}

#[error_code]
pub enum QuestError {
  #[msg("The minimum stake required exceeds the staked amount.")]
  MinStakeRequiredExceedsStaked,

  #[msg("The owner does not have enough governance tokens.")]
  NotEnoughTokenBalance,

  #[msg("The Quest is already published.")]
  QuestAlreadyPublished,

  #[msg("Cannot update an already published Quest.")]
  UpdateNotAllowed,

  #[msg("The Quest is not open.")]
  QuestNotOpen,

  #[msg("The Quest cannot be closed.")]
  CloseNotAllowed,

  #[msg("Insufficient stake amount for the Quest.")]
  StakeAmountTooLow,

  #[msg("The stake amount is too high for the Quest.")]
  StakeAmountTooHigh,

  #[msg("The Quest cannot be completed.")]
  CompleteNotAllowed,
}