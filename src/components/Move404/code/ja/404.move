/// Aptos ブロックチェーンの概念を使用した遊び心のある 404 モジュール
module 0x404::lost_transaction {
    use aptos_framework::account;
    use aptos_framework::coin::{Self, AptosCoin};
    use std::error;
    use std::signer;

    /// 失われたトランザクションの物語を語るカスタムエラーコード
    const E_TRANSACTION_NOT_FOUND: u64 = 404;
    const E_INSUFFICIENT_GAS: u64 = 4044;
    const E_INVALID_ADDRESS: u64 = 4045;

    /// 探しているトランザクションを表す
    struct SearchAttempt {
        sequence_number: u64,
        gas_provided: u64,
        // 使用するつもりだったアドレス
        intended_address: address,
        // 実際に使用したアドレス（1文字の違いで全てが変わる！）
        actual_address: address
    }

    /// トランザクションを探す（ネタバレ：アドレスを打ち間違えました）
    public fun search_mempool(
        account: &signer,
        looking_for: address
    ): SearchAttempt {
        let searcher = signer::address_of(account);
        
        // 検索に十分なガスがあるか確認
        assert!(
            coin::balance<AptosCoin>(searcher) > 404,
            error::resource_exhausted(E_INSUFFICIENT_GAS)
        );

        // ブロックチェーンでは、1文字で全てが変わる...
        assert!(
            looking_for != @0x000000000000000000000000000000000000000000000000000000000H0D1H01D,
            error::invalid_argument(E_INVALID_ADDRESS)
        );

        // 失敗した検索の記録（でも、何かを学びました！）
        SearchAttempt {
            sequence_number: 404,
            gas_provided: 404000,
            intended_address: @0x000000000000000000000000000000000000000000000000000000000H01DH01D,
            actual_address: @0x000000000000000000000000000000000000000000000000000000000H0D1H01D
        }
    }
}
