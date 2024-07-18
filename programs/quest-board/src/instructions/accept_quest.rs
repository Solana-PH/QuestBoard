// both parties must sign this
// multisig happens using partykit

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer, transfer};

use crate::{
  state::Quest,
  state::QuestError,
  state::Config,
  state::Counter,
};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct AcceptQuestParams {
  pub stake_amount: u64,
  pub offeree_proposal_hash: [u8; 32],
}

#[derive(Accounts)]
#[instruction(params: AcceptQuestParams)]
pub struct AcceptQuest<'info> {

  #[account(
    mut,
    seeds = [
      b"quest",
      quest.id.key().as_ref(),
    ],
    bump = quest.bump,
    has_one = owner,
    constraint = quest.status == 1 @ QuestError::QuestNotOpen,
    constraint = offeree.key() != owner.key() @ QuestError::OwnerCannotAcceptOwnQuest,
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
    constraint = offeree_token_account.amount >= quest.min_stake_required @ QuestError::NotEnoughTokenBalance,
    constraint = params.stake_amount >= quest.min_stake_required @ QuestError::StakeAmountTooLow,
    constraint = params.stake_amount <= quest.staked @ QuestError::StakeAmountTooHigh,
  )]
  pub offeree_token_account: Account<'info, TokenAccount>,

  pub token_mint: Account<'info, Mint>,

  pub offeree: Signer<'info>,

  pub owner: Signer<'info>,

  #[account(
    seeds = [b"config"],
    bump = config.bump,
    has_one = token_mint,
  )]
  pub config: Account<'info, Config>,

  #[account(
    mut,
    seeds = [b"counter"],
    bump = counter.bump,
  )]
  pub counter: Account<'info, Counter>,

  pub system_program: Program<'info, System>,
  pub associated_token_program: Program<'info, AssociatedToken>,
  pub token_program: Program<'info, Token>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn accept_quest_handler(ctx: Context<AcceptQuest>, params: AcceptQuestParams) -> Result<()> {

  let quest = &mut ctx.accounts.quest;
  let counter = &mut ctx.accounts.counter;

  // transfer governance tokens
  let cpi_accounts = Transfer {
    from: ctx.accounts.offeree_token_account.to_account_info(),
    to: ctx.accounts.escrow_token_account.to_account_info(),
    authority: ctx.accounts.offeree.to_account_info(),
  };
  let cpi_program = ctx.accounts.token_program.to_account_info();
  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
  transfer(cpi_ctx, params.stake_amount)?;

  quest.offeree = Some(ctx.accounts.offeree.key());
  quest.offeree_staked = Some(params.stake_amount);
  quest.offeree_proposal_hash = Some(params.offeree_proposal_hash);
  quest.accepted_timestamp = Some(Clock::get()?.slot);
  
  quest.status = 3;
  counter.posts_open -= 1;
  counter.posts_taken += 1;

  Ok(())
}