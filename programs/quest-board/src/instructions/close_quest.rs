// closing an unpublished quest - retrieve owner's placement fee (if any) and return governance token

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer, CloseAccount};

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
      quest.id.key().as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    close = owner,
    constraint = (quest.status == 0 || quest.status == 7) @ QuestError::CloseNotAllowed,
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
    associated_token::authority = owner,
  )]
  pub owner_token_account: Account<'info, TokenAccount>,

  #[account(
    seeds = [
      b"config",
    ],
    bump = config.bump,
    has_one = token_mint,
    has_one = treasury,
  )]
  pub config: Account<'info, Config>,

  #[account(mut)]
  /// CHECK: has_one in the config account
  pub treasury: UncheckedAccount<'info>,

  pub owner: Signer<'info>,

  pub token_mint: Account<'info, Mint>,

  pub system_program: Program<'info, System>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn close_quest_handler(ctx: Context<CloseQuest>) -> Result<()> {

  // drain the escrow token account and send it back to the owner
  let quest = &ctx.accounts.quest;
  let id = quest.id.key();
  let quest_bump = quest.bump.to_le_bytes();
  let escrow = &mut ctx.accounts.escrow_token_account;
  let owner = &mut ctx.accounts.owner;

  let seeds = vec![
    b"quest".as_ref(), 
    id.as_ref(),
    quest_bump.as_ref()
  ];
  let signer = vec![seeds.as_slice()];

  let transfer_ix = Transfer {
    from: escrow.to_account_info(),
    to: ctx.accounts.owner_token_account.to_account_info(),
    authority: quest.to_account_info(),
  };

  let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    transfer_ix,
    signer.as_slice()
  );

  transfer(cpi_ctx, escrow.amount)?;

  let close_ix = CloseAccount {
    account: escrow.to_account_info(),
    destination: owner.to_account_info(),
    authority: quest.to_account_info(),
  };

  let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    close_ix,
    signer.as_slice(),
  );

  anchor_spl::token::close_account(cpi_ctx)?;

  ctx.accounts.quest.close_account()?;

  Ok(())
}
