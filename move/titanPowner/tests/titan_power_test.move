#[test_only]
module TitanPower::titan_power_test {
    use aptos_framework::account;
    use aptos_framework::coin;
    use std::vector;
    use std::signer;
    use std::string;

    use TitanPower::titan_power::{Self, UserCoin};

    const AMOUNT_TO_MINT: u64 = 2_000_000_000;
    const AMOUNT_TO_BURN: u64 = 1_000_000_000;
    const AMOUNY_TO_APPROVE: u64 = 1_000_000_000_000;
    const ZERO_AMOUNT: u64 = 0;
    const WRONG_BALANCE_MINT: u64 = 2;
    const WRONG_BALANCE_BURN: u64 = 2;
    const WRONG_BALANCE_TRANSFER: u64 = 2;
    const WRONG_REGISTER: u64 = 3;
    const WRONG_WHITELIST: u64 = 4;
    const WRONF_AMOUNT_APPROVE: u64 = 5;

    const NAME_TOKEN: vector<u8> = b"Heli Canodo";
    const SYMBOL_TOKEN: vector<u8> = b"HELI";
    const DECIMALS: u8 = 8;
    const MONITOR_SUPPLY: bool = true;

    #[test(coin_admin = @TitanPower)]
    fun test_mint_burn_coins(coin_admin: signer) {
        let address1 = @0x01;
        let address2 = @0x02;

        let user1 = account::create_account_for_test(address1);
        let user2 = account::create_account_for_test(address2);

        let initial_whitelist = vector<address>[address1, address2, @TitanPower];

        titan_power::initialize(
            &coin_admin,
            string::utf8(NAME_TOKEN),
            string::utf8(SYMBOL_TOKEN),
            DECIMALS,
            MONITOR_SUPPLY,
            initial_whitelist
        );

        coin::register<UserCoin>(&user1);
        coin::register<UserCoin>(&user2);

        let is_account_registered1 = titan_power::is_account_registered(address1);
        assert!(
            is_account_registered1,
            WRONG_REGISTER
        );
        let is_account_registered2 = titan_power::is_account_registered(address2);
        assert!(
            is_account_registered2,
            WRONG_REGISTER
        );

        let get_all_whitelist = titan_power::get_all_whitelist();
        assert!(
            vector::length(&get_all_whitelist) == 3,
            WRONG_WHITELIST
        );

        let address3 = @0x03;
        let user3 = account::create_account_for_test(address3);
        let user3_public = signer::address_of(&user3);
        titan_power::update_whitelist(&coin_admin, user3_public, true);

        let get_all_whitelistAfter = titan_power::get_all_whitelist();
        assert!(
            vector::length(&get_all_whitelistAfter) == 4,
            WRONG_WHITELIST
        );
        let is_in_whitelist = titan_power::is_in_whitelist(user3_public);
        assert!(is_in_whitelist, WRONG_WHITELIST);

        titan_power::update_whitelist(&coin_admin, user3_public, false);
        let get_all_whitelistAfterDelete = titan_power::get_all_whitelist();
        assert!(
            vector::length(&get_all_whitelistAfterDelete) == 3,
            WRONG_WHITELIST
        );
        let is_in_whitelist = titan_power::is_in_whitelist(user3_public);
        assert!(!is_in_whitelist, WRONG_WHITELIST);

        // check mint token
        titan_power::mint(
            &coin_admin,
            address1,
            AMOUNT_TO_MINT
        );
        let balance1 = coin::balance<UserCoin>(address1);
        assert!(
            balance1 == AMOUNT_TO_MINT,
            WRONG_BALANCE_MINT
        );

        // check burn token
        titan_power::burn(&user1, AMOUNT_TO_BURN);
        let balanceOfUser1Before = coin::balance<UserCoin>(address1);
        assert!(
            balanceOfUser1Before == AMOUNT_TO_BURN,
            WRONG_BALANCE_BURN
        );

        let balanceOfUser2Before = coin::balance<UserCoin>(address2);
        assert!(
            balanceOfUser2Before == ZERO_AMOUNT,
            WRONG_BALANCE_TRANSFER
        );

        // check transfer here
        coin::transfer<UserCoin>(&user1, address2, AMOUNT_TO_BURN);
        let balanceOfUser1Before = coin::balance<UserCoin>(address1);
        assert!(
            balanceOfUser1Before == ZERO_AMOUNT,
            WRONG_BALANCE_BURN
        );
        let balanceOfUser2Before = coin::balance<UserCoin>(address2);
        assert!(
            balanceOfUser2Before == AMOUNT_TO_BURN,
            WRONG_BALANCE_TRANSFER
        );

        // check approve
        let amountApptoveOfUserBefore = titan_power::get_allowance(address1, address2);
        assert!(
            amountApptoveOfUserBefore == ZERO_AMOUNT,
            WRONF_AMOUNT_APPROVE
        );
        titan_power::approve(&user1, address2, AMOUNY_TO_APPROVE);
        let amountApptoveOfUserAfter = titan_power::get_allowance(address1, address2);
        assert!(
            amountApptoveOfUserAfter == AMOUNY_TO_APPROVE,
            WRONF_AMOUNT_APPROVE
        );
    }
}
