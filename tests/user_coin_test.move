#[test_only]
module coin_address::user_coin_tests {
    use aptos_framework::account;
    use aptos_framework::coin;

    use coin_address::token_erc20::{Self, UserCoin};

    const AMOUNT_TO_MINT: u64 = 100_000_000;
    const WRONG_BALANCE_MINT: u64 = 2;
    const WRONG_BALANCE_BURN: u64 = 2;

    #[test(coin_admin = @coin_address)]
    fun test_mint_burn_coins(coin_admin: signer) {
        token_erc20::initialize(&coin_admin);

        let user_addr = @0x41;

        let user = account::create_account_for_test(user_addr);

        coin::register<UserCoin>(&user);

        token_erc20::mint(
            &coin_admin,
            user_addr,
            AMOUNT_TO_MINT
        );
        let balance_of_user = coin::balance<UserCoin>(user_addr);
        assert!(
            balance_of_user == AMOUNT_TO_MINT,
            WRONG_BALANCE_MINT
        );

        token_erc20::burn(&user, AMOUNT_TO_MINT);
        let balance_of_user_after = coin::balance<UserCoin>(user_addr);
        assert!(
            balance_of_user_after == 0,
            WRONG_BALANCE_MINT
        );
    }
}
