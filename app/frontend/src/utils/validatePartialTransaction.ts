// todo: this is important

// const { Transaction, PublicKey } = require('@solana/web3.js');
// const bs58 = require('bs58');

// // Example function to verify the transaction
// function verifyTransaction(transaction, expectedProgramId, expectedAccounts) {
//     let isValid = true;

//     // Loop through each instruction in the transaction
//     for (let instruction of transaction.instructions) {
//         // Check if the instruction's program ID matches the expected program ID
//         if (!instruction.programId.equals(expectedProgramId)) {
//             console.error(`Invalid program ID: ${instruction.programId.toBase58()}`);
//             isValid = false;
//         }

//         // Check if all expected accounts are present in the instruction's account keys
//         for (let expectedAccount of expectedAccounts) {
//             if (!instruction.keys.some(key => key.pubkey.equals(expectedAccount))) {
//                 console.error(`Missing expected account: ${expectedAccount.toBase58()}`);
//                 isValid = false;
//             }
//         }
//     }

//     return isValid;
// }

// // Deserialize the transaction
// const base64Transaction = '<base64-encoded-transaction>';
// const transactionBuffer = Buffer.from(base64Transaction, 'base64');
// const transaction = Transaction.from(transactionBuffer);

// // Define the expected program ID and accounts
// const expectedProgramId = new PublicKey('<expected-program-id>');
// const expectedAccounts = [
//     new PublicKey('<expected-account-1>'),
//     new PublicKey('<expected-account-2>'),
//     // Add more expected accounts as needed
// ];

// // Verify the transaction
// if (verifyTransaction(transaction, expectedProgramId, expectedAccounts)) {
//     console.log('Transaction is valid');
// } else {
//     console.log('Transaction is invalid');
// }
