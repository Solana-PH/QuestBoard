use anchor_lang::prelude::*;

declare_id!("E69Kac8iuarujp7bTZtkEGjCsXWyx3MvXpQ1gv5Q6Mdz");

#[program]
pub mod quest_board {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
