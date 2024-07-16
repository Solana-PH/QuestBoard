use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer};

use crate::{state::Config, state::Quest, state::QuestError};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateQuestParams {
  pub stake_amount: u64,
  pub min_stake_required: u64,
  pub placement_paid: u64,
  pub details_hash: [u8; 32],
}

#[derive(Accounts)]
#[instruction(params: CreateQuestParams)]
pub struct CreateQuest<'info> {

  #[account(
    init, 
    payer = owner, 
    seeds = [
      b"quest",
      id.key().as_ref(),
    ], 
    bump, 
    space = Quest::len()
  )]
  pub quest: Box<Account<'info, Quest>>,

  pub id: Signer<'info>,

  #[account(
    init_if_needed,
    payer = owner,
    associated_token::mint = token_mint,
    associated_token::authority = quest
  )]
  pub escrow_token_account: Account<'info, TokenAccount>,

  #[account(
    mut,
    associated_token::mint = token_mint,
    associated_token::authority = owner,      
    constraint = owner_token_account.amount >= params.stake_amount @ QuestError::NotEnoughTokenBalance,
  )]
  pub owner_token_account: Account<'info, TokenAccount>,

  pub token_mint: Account<'info, Mint>,

  #[account(mut)]
  /// CHECK: has_one in the config account
  pub treasury: UncheckedAccount<'info>,

  #[account(
    seeds = [
      b"config"
    ],
    has_one = token_mint,
    has_one = treasury,
    bump = config.bump,
  )]
  pub config: Account<'info, Config>,

  #[account(mut)]
  pub owner: Signer<'info>,

  pub system_program: Program<'info, System>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn create_quest_handler(ctx: Context<CreateQuest>, params: CreateQuestParams) -> Result<()> {

  let quest = &mut ctx.accounts.quest;
  let owner = &mut ctx.accounts.owner;
  let config = &ctx.accounts.config;
  let treasury = &ctx.accounts.treasury;

  quest.bump = ctx.bumps.quest;
  quest.status = 0;
  quest.id = ctx.accounts.id.key();
  quest.owner = owner.key();
  quest.timestamp = Clock::get()?.slot;
  quest.staked = params.stake_amount;
  quest.min_stake_required = params.min_stake_required;
  quest.placement_paid = params.placement_paid;
  quest.details_hash = params.details_hash;
  quest.offeree = None;
  quest.offeree_staked = None;
  quest.offeree_proposal_hash = None;
  quest.owner_votes = None;
  quest.offeree_votes = None;
  quest.abstained_votes = None;

  // min_stake_required should not exceed the staked amount
  if quest.min_stake_required > quest.staked {
    return Err(QuestError::MinStakeRequiredExceedsStaked.into());
  }

  // pay base_fee to treasury
  let base_fee = config.base_fee;
  
  let ix = anchor_lang::solana_program::system_instruction::transfer(
    &owner.key(),
    &treasury.key(),
    base_fee,
  );

  anchor_lang::solana_program::program::invoke(
    &ix,
    &[
      owner.to_account_info(),
      ctx.accounts.system_program.to_account_info(),
    ],
  )?;

  // transfer SOL for placement fee
  let ix = anchor_lang::solana_program::system_instruction::transfer(
    &owner.key(),
    &quest.key(),
    quest.placement_paid,
  );

  anchor_lang::solana_program::program::invoke(
    &ix,
    &[
      owner.to_account_info(),
      ctx.accounts.system_program.to_account_info(),
    ],
  )?;

  // transfer governance tokens
  let cpi_accounts = Transfer {
    from: ctx.accounts.owner_token_account.to_account_info(),
    to: ctx.accounts.escrow_token_account.to_account_info(),
    authority: ctx.accounts.owner.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
  transfer(cpi_ctx, quest.staked)?;

  Ok(())
}
