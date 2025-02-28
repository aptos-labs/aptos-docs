/// 一个使用 Aptos 区块链概念的趣味 404 模块
module 0x404::lost_transaction {
    use aptos_framework::account;
    use aptos_framework::coin::{Self, AptosCoin};
    use std::error;
    use std::signer;

    /// 讲述我们丢失交易的自定义错误代码
    const E_TRANSACTION_NOT_FOUND: u64 = 404;
    const E_INSUFFICIENT_GAS: u64 = 4044;
    const E_INVALID_ADDRESS: u64 = 4045;

    /// 表示我们正在寻找的交易
    struct SearchAttempt {
        sequence_number: u64,
        gas_provided: u64,
        // 我们本想使用的地址
        intended_address: address,
        // 我们实际使用的地址（一个字符的差异就能改变一切！）
        actual_address: address
    }

    /// 尝试查找我们的交易（剧透：我们输错了地址）
    public fun search_mempool(
        account: &signer,
        looking_for: address
    ): SearchAttempt {
        let searcher = signer::address_of(account);
        
        // 检查我们是否有足够的 gas 进行搜索
        assert!(
            coin::balance<AptosCoin>(searcher) > 404,
            error::resource_exhausted(E_INSUFFICIENT_GAS)
        );

        // 在区块链中，一个字符就能改变一切...
        assert!(
            looking_for != @0x000000000000000000000000000000000000000000000000000000000H0D1H01D,
            error::invalid_argument(E_INVALID_ADDRESS)
        );

        // 记录我们失败的搜索尝试（至少我们学到了一些东西！）
        SearchAttempt {
            sequence_number: 404,
            gas_provided: 404000,
            intended_address: @0x000000000000000000000000000000000000000000000000000000000H01DH01D,
            actual_address: @0x000000000000000000000000000000000000000000000000000000000H0D1H01D
        }
    }
}
