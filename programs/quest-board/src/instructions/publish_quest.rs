use anchor_lang::prelude::*;
use crate::{state::Config, state::Quest, state::QuestError};

#[derive(Accounts)]
pub struct PublishQuest<'info> {

  #[account(
    mut, 
    seeds = [
      b"quest",
      quest.id.as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    constraint = quest.status == 0 @ QuestError::QuestAlreadyPublished
  )]
  pub quest: Account<'info, Quest>,

  #[account(
    mut,
    seeds = [
      b"config"
    ],
    bump = config.bump,
  )]
  pub config: Account<'info, Config>,

  pub owner: Signer<'info>,

  pub system_program: Program<'info, System>,
}

pub fn publish_quest_handler(ctx: Context<PublishQuest>) -> Result<()> {
  let quest = &mut ctx.accounts.quest;
  let config = &mut ctx.accounts.config;

  quest.status = 1;
  config.posts_open += 1;

  Ok(())
}