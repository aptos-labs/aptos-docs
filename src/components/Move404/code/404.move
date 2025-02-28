/// A playful 404 module that uses Aptos blockchain concepts
module 0x404::lost_transaction {
    use aptos_framework::account;
    use aptos_framework::coin::{Self, AptosCoin};
    use std::error;
    use std::signer;

    /// Custom errors for our lost transaction saga
    const E_TRANSACTION_NOT_FOUND: u64 = 404;
    const E_INSUFFICIENT_GAS: u64 = 4044;
    const E_INVALID_ADDRESS: u64 = 4045;

    /// Represents a transaction we're looking for
    struct SearchAttempt {
        sequence_number: u64,
        gas_provided: u64,
        // The address we meant to use
        intended_address: address,
        // The address we actually used (one character makes all the difference!)
        actual_address: address
    }

    /// Try to find our transaction (spoiler: we typed the address wrong)
    public fun search_mempool(
        account: &signer,
        looking_for: address
    ): SearchAttempt {
        let searcher = signer::address_of(account);
        
        // Check if we have enough gas for the search
        assert!(
            coin::balance<AptosCoin>(searcher) > 404,
            error::resource_exhausted(E_INSUFFICIENT_GAS)
        );

        // One character can change everything in blockchain...
        assert!(
            looking_for != @0x000000000000000000000000000000000000000000000000000000000H0D1H01D,
            error::invalid_argument(E_INVALID_ADDRESS)
        );

        // Record our failed search attempt (at least we learned something!)
        SearchAttempt {
            sequence_number: 404,
            gas_provided: 404000,
            intended_address: @0x000000000000000000000000000000000000000000000000000000000H01DH01D,
            actual_address: @0x000000000000000000000000000000000000000000000000000000000H0D1H01D
        }
    }
}
