use anchor_lang::prelude::*;
use crate::{state::Quest, state::QuestError};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct UpdateQuestHashParams {
  pub details_hash: [u8; 32],
}

#[derive(Accounts)]
#[instruction(params: UpdateQuestHashParams)]
pub struct UpdateQuestHash<'info> {

  #[account(
    mut, 
    seeds = [
      b"quest",
      quest.id.as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    constraint = quest.status == 0 @ QuestError::UpdateNotAllowed
  )]
  pub quest: Account<'info, Quest>,

  pub owner: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn update_quest_hash_handler(ctx: Context<UpdateQuestHash>, params: UpdateQuestHashParams) -> Result<()> {
  let quest = &mut ctx.accounts.quest;

  quest.details_hash = params.details_hash;

  Ok(())
}