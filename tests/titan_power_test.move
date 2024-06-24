#[test_only]
module coin_address::titan_power {
    use aptos_framework::account;
    use aptos_framework::coin;
    use std::debug::print;
    use std::vector;
    use std::signer;

    use coin_address::token_erc20::{Self, UserCoin};

    const AMOUNT_TO_MINT: u64 = 100_000_000;
    const WRONG_BALANCE_MINT: u64 = 2;
    const WRONG_BALANCE_BURN: u64 = 2;
    const WRONG_REGISTER: u64 = 3;
    const WRONG_WHITELIST: u64 = 4;

    #[test(coin_admin = @coin_address)]
    fun test_mint_burn_coins(coin_admin: signer) {
        let address1 = @0x01;
        let address2 = @0x02;

        let user1 = account::create_account_for_test(address1);
        let user2 = account::create_account_for_test(address2);

        let initial_whitelist = vector<address>[
            address1,
            address2,
            @coin_address
        ];

        token_erc20::initialize(&coin_admin, initial_whitelist);

        coin::register<UserCoin>(&user1);
        coin::register<UserCoin>(&user2);

        let is_account_registered1 = token_erc20::is_account_registered(address1);
        assert!(
            is_account_registered1,
            WRONG_REGISTER
        );
        let is_account_registered2 = token_erc20::is_account_registered(address2);
        assert!(
            is_account_registered2,
            WRONG_REGISTER
        );

        let get_all_whitelist = token_erc20::get_all_whitelist();
        assert!(
            vector::length(&get_all_whitelist) == 3,
            WRONG_WHITELIST
        );

        let address3 = @0x03;
        let user3 = account::create_account_for_test(address3);
        let user3_public = signer::address_of(&user3);
        token_erc20::update_whitelist(&coin_admin, user3_public, true);

        let get_all_whitelistAfter = token_erc20::get_all_whitelist();
        assert!(
            vector::length(&get_all_whitelistAfter) == 4,
            WRONG_WHITELIST
        );
        let is_in_whitelist = token_erc20::is_in_whitelist(user3_public);
        assert!(is_in_whitelist, WRONG_WHITELIST);

        token_erc20::update_whitelist(&coin_admin, user3_public, false);
        let get_all_whitelistAfterDelete = token_erc20::get_all_whitelist();
        assert!(
            vector::length(&get_all_whitelistAfterDelete) == 3,
            WRONG_WHITELIST
        );
        let is_in_whitelist = token_erc20::is_in_whitelist(user3_public);
        assert!(!is_in_whitelist, WRONG_WHITELIST);
    }
}
