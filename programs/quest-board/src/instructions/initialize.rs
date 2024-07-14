use anchor_lang::prelude::*;

use crate::{program::QuestBoard, state::Config};

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct InitializeParams {
  pub treasury: Pubkey,
  pub token: Pubkey,
  pub base_fee: u64,
  pub decay_fee: u64,
  pub decay_start: u64,
  pub vote_threshold: u64,
  pub dispute_duration: u64,
  pub staked_vote_power_start: u64,
  pub unstaked_vote_unlock_interval: u64,
}

#[derive(Accounts)]
#[instruction(params: InitializeParams)]
pub struct Initialize<'info> {

  #[account(
    init, 
    payer = authority, 
    seeds = [
      "config".as_bytes(),
    ], 
    bump, 
    space = Config::len()
  )]
  pub config: Account<'info, Config>,

  #[account(mut)]
  pub authority: Signer<'info>,

  #[account(
    constraint = program.programdata_address()? == Some(program_data.key())
  )]
  pub program: Program<'info, QuestBoard>,

  #[account(
    constraint = program_data.upgrade_authority_address == Some(authority.key())
  )]
  pub program_data: Box<Account<'info, ProgramData>>,

  pub system_program: Program<'info, System>,
}

pub fn initialize_handler(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
  let config = &mut ctx.accounts.config;

  config.bump = ctx.bumps.config;
  config.authority = ctx.accounts.authority.key();
  config.treasury = params.treasury.key();
  config.token = params.token.key();
  config.base_fee = params.base_fee;
  config.decay_fee = params.decay_fee;
  config.decay_start = params.decay_start;
  config.vote_threshold = params.vote_threshold;
  config.dispute_duration = params.dispute_duration;
  config.staked_vote_power_start = params.staked_vote_power_start;
  config.unstaked_vote_unlock_interval = params.unstaked_vote_unlock_interval;

  Ok(())
}
