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

  pub fn publish_quest(ctx: Context<PublishQuest>) -> Result<()> {
    publish_quest_handler(ctx)
  }

  pub fn unpublish_quest(ctx: Context<UnpublishQuest>) -> Result<()> {
    unpublish_quest_handler(ctx)
  }

  pub fn update_quest(ctx: Context<UpdateQuest>, params: UpdateQuestParams) -> Result<()> {
    update_quest_handler(ctx, params)
  }

  pub fn close_quest(ctx: Context<CloseQuest>) -> Result<()> {
    close_quest_handler(ctx)
  }

  pub fn accept_quest(ctx: Context<AcceptQuest>, params: AcceptQuestParams) -> Result<()> {
    accept_quest_handler(ctx, params)
  }

}
