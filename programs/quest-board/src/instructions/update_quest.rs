use anchor_lang::prelude::*;
use crate::{state::Quest, state::QuestError};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UpdateQuestParams {
  pub details_hash: Option<[u8; 32]>,
  pub min_stake_required: Option<u64>,
}

#[derive(Accounts)]
#[instruction(params: UpdateQuestParams)]
pub struct UpdateQuest<'info> {

  #[account(
    mut, 
    seeds = [
      b"quest",
      quest.id.to_le_bytes().as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    constraint = quest.status == 0 @ QuestError::UpdateNotAllowed
  )]
  pub quest: Account<'info, Quest>,

  pub owner: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn update_quest_handler(ctx: Context<UpdateQuest>, params: UpdateQuestParams) -> Result<()> {
  let quest = &mut ctx.accounts.quest;

  if params.details_hash.is_some() {
    quest.details_hash = params.details_hash.unwrap();
  }

  if params.min_stake_required.is_some() {
    quest.min_stake_required = params.min_stake_required.unwrap();
  }

  Ok(())
}