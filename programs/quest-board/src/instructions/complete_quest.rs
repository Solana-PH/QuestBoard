// both parties must sign this

// closing a complete quest - return both owner and offeree's staked governance token, and owner's placement fee (if any)

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer};

use crate::{
  state::Quest,
  state::QuestError,
  state::Config,
  state::Counter,
};

#[derive(Accounts)]
pub struct CompleteQuest<'info> {
  #[account(
    mut,
    seeds = [
      b"quest",
      quest.id.key().as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    constraint = quest.status == 3 @ QuestError::CompleteNotAllowed,
  )]
  pub quest: Box<Account<'info, Quest>>,

  #[account(
    mut,
    associated_token::mint = token_mint,
    associated_token::authority = quest,
  )]
  pub escrow_token_account: Account<'info, TokenAccount>,

  #[account(
    mut,
    associated_token::mint = token_mint,
    associated_token::authority = offeree,
  )]
  pub offeree_token_account: Account<'info, TokenAccount>,

  #[account(
    seeds = [
      b"config",
    ],
    bump = config.bump,
    has_one = token_mint,
    has_one = treasury,
  )]
  pub config: Account<'info, Config>,

  #[account(
    mut,
    seeds = [
      b"counter",
    ],
    bump = counter.bump,
  )]
  pub counter: Account<'info, Counter>,

  #[account(mut)]
  /// CHECK: has_one in the config account
  pub treasury: UncheckedAccount<'info>,

  pub owner: Signer<'info>,

  pub offeree: Signer<'info>,

  pub token_mint: Account<'info, Mint>,

  pub system_program: Program<'info, System>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn complete_quest_handler(ctx: Context<CompleteQuest>) -> Result<()> {

  let quest = &mut ctx.accounts.quest;
  let id = quest.id.key();
  let quest_bump = quest.bump.to_le_bytes();
  let counter = &mut ctx.accounts.counter;

  let offeree_staked = quest.offeree_staked.unwrap();

  let seeds = vec![
    b"quest".as_ref(), 
    id.as_ref(),
    quest_bump.as_ref()
  ];
  let signer = vec![seeds.as_slice()];

  let transfer_ix = Transfer {
    from: ctx.accounts.escrow_token_account.to_account_info(),
    to: ctx.accounts.offeree_token_account.to_account_info(),
    authority: quest.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new_with_signer(cpi_program, transfer_ix, signer.as_slice());
  transfer(cpi_ctx, offeree_staked)?;

  quest.status = 7; 
  counter.posts_taken -= 1;
  counter.posts_completed += 1;

  Ok(())
}


