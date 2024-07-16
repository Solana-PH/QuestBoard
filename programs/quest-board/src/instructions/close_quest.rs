// closing an unpublished quest - retrieve owner's placement fee (if any) and return governance token

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer};

use crate::{
  state::Quest,
  state::QuestError,
  state::Config,
};

#[derive(Accounts)]
pub struct CloseQuest<'info> {
  #[account(
    mut,
    seeds = [
      b"quest",
      quest.id.to_le_bytes().as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    close = owner,
    constraint = quest.status == 0 @ QuestError::CloseNotAllowed,
  )]
  pub quest: Box<Account<'info, Quest>>,

  #[account(
    mut,
    associated_token::mint = token_mint,
    associated_token::authority = quest,
    close = owner,
  )]
  pub escrow_token_account: Account<'info, TokenAccount>,

  #[account(
    mut,
    associated_token::mint = token_mint,
    associated_token::authority = owner,
  )]
  pub owner_token_account: Account<'info, TokenAccount>,

  #[account(
    seeds = [
      b"config",
    ],
    bump = config.bump,
    has_one = token_mint,
  )]
  pub config: Account<'info, Config>,

  pub owner: Signer<'info>,

  pub token_mint: Account<'info, Mint>,

  pub system_program: Program<'info, System>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn close_quest_handler(ctx: Context<CloseQuest>) -> Result<()> {

  // drain the escrow token account and send it back to the owner
  let config = &ctx.accounts.config;
  let seeds = &[b"config".as_ref(), &[config.bump]];
  let signer = &[&seeds[..]];

  let cpi_accounts = Transfer {
    from: ctx.accounts.escrow_token_account.to_account_info(),
    to: ctx.accounts.owner_token_account.to_account_info(),
    authority: ctx.accounts.config.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
  transfer(cpi_ctx, ctx.accounts.escrow_token_account.amount)?;

  // compute necessary decay fee, if any
  ctx.accounts.quest.close_account()?;

  Ok(())
}


