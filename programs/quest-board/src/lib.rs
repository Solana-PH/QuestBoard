use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

pub use instructions::*;

declare_id!("E69Kac8iuarujp7bTZtkEGjCsXWyx3MvXpQ1gv5Q6Mdz");

#[program]
pub mod quest_board {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    initialize_handler(ctx, params)
  }

  pub fn create_quest(ctx: Context<CreateQuest>, params: CreateQuestParams) -> Result<()> {
    create_quest_handler(ctx, params)
  }
}
