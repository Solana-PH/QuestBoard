use anchor_lang::prelude::*;
use crate::{state::Counter, state::Quest, state::QuestError};

#[derive(Accounts)]
pub struct PublishQuest<'info> {

  #[account(
    mut, 
    seeds = [
      b"quest",
      quest.id.to_le_bytes().as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    constraint = quest.status == 0 @ QuestError::QuestAlreadyPublished
  )]
  pub quest: Account<'info, Quest>,

  #[account(
    mut,
    seeds = [
      b"counter"
    ],
    bump = counter.bump,
  )]
  pub counter: Account<'info, Counter>,

  pub owner: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn publish_quest_handler(ctx: Context<PublishQuest>) -> Result<()> {
  let quest = &mut ctx.accounts.quest;
  let counter = &mut ctx.accounts.counter;

  quest.status = 1;
  counter.posts_open += 1;

  Ok(())
}