module TitanPower::titan_power {
    use std::signer;
    use std::vector;
    use aptos_framework::coin::{
        Self,
        MintCapability,
        BurnCapability,
    };
    use aptos_framework::table::{Self, Table};
    use aptos_framework::event::{Self};
    use std::string;

    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_COIN_INITIALIZED: u64 = 2;
    const ERR_COIN_NOT_INITIALIZED: u64 = 3;
    const ERR_NOT_IN_WHITELIST: u64 = 4;
    const ERR_NOT_APPROVED_ADD: u64 = 5;
    const ERR_NOT_APPROVED_BALANCE: u64 = 6;
    const ERR_INSUFFICIENT_ALLOWANCE: u64 = 7;

    struct UserCoin {}

    struct Capabilities has key {
        mint_cap: MintCapability<UserCoin>,
        burn_cap: BurnCapability<UserCoin>,
    }

    struct Whitelist has key {
        whitelist: vector<address>,
    }

    struct Allowances has key {
        allowances: Table<address, Table<address, u64>>
    }
    
    #[event]
    struct ApproveEvent has drop, store {
        sender: address,
        receiver: address,
        amount: u64
    }

    public entry fun initialize(
        coin_admin: &signer,
        name: string::String,
        symbol: string::String,
        decimals: u8,
        monitor_supply: bool,
        initial_whitelist: vector<address>
    ) {
        assert!(
            signer::address_of(coin_admin) == @TitanPower,
            ERR_NOT_ADMIN
        );

        assert!(
            !coin::is_coin_initialized<UserCoin>(),
            ERR_COIN_INITIALIZED
        );

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<UserCoin>(
            coin_admin,
            name,
            symbol,
            decimals,
            monitor_supply
        );

        coin::destroy_freeze_cap(freeze_cap);
        let caps = Capabilities {mint_cap, burn_cap};
        move_to(coin_admin, caps);
        move_to(
            coin_admin,
            Whitelist {whitelist: initial_whitelist}
        );
        move_to(
            coin_admin,
            Allowances {allowances: table::new()}
        );
    }

    public entry fun register(userAddress: &signer) {
        coin::register<UserCoin>(userAddress);
    }

    public entry fun approve(
        owner: &signer,
        spender: address,
        amount: u64
    ) acquires Allowances {
        let owner_address = signer::address_of(owner);
        let allowancesOps = borrow_global_mut<Allowances>(@TitanPower);

        if (!table::contains(&allowancesOps.allowances, owner_address)) {
            table::add(&mut allowancesOps.allowances, owner_address, table::new<address, u64>());
        };

        let owner_allowances = table::borrow_mut(&mut allowancesOps.allowances, owner_address);
        if (table::contains(owner_allowances, spender)) {
            let spender_allowance = table::borrow_mut(owner_allowances, spender);
            *spender_allowance = amount;
        } else {
            table::add(owner_allowances, spender, amount);
        };

        event::emit(ApproveEvent {sender: owner_address, receiver: spender, amount: amount});
    }

    public entry fun mint(
        coin_admin: &signer,
        to_address: address,
        amount: u64
    ) acquires Capabilities, Whitelist {
        assert!(
            signer::address_of(coin_admin) == @TitanPower,
            ERR_NOT_ADMIN
        );

        assert!(
            coin::is_coin_initialized<UserCoin>(),
            ERR_COIN_NOT_INITIALIZED
        );

        let whitelist = borrow_global<Whitelist>(@TitanPower).whitelist;
        assert!(
            vector::contains(&whitelist, &to_address),
            ERR_NOT_IN_WHITELIST
        );

        let caps = borrow_global<Capabilities>(@TitanPower);
        let coins = coin::mint(amount, &caps.mint_cap);
        coin::deposit(to_address, coins);
    }

    public entry fun burn(
        user: &signer,
        amount: u64
    ) acquires Capabilities {
        assert!(
            coin::is_coin_initialized<UserCoin>(),
            ERR_COIN_NOT_INITIALIZED
        );

        let coin = coin::withdraw<UserCoin>(user, amount);
        let caps = borrow_global<Capabilities>(@TitanPower);

        coin::burn(coin, &caps.burn_cap);
    }

    // public entry fun transfer_from(
    //     spender: &signer,
    //     owner: address,
    //     recipient: address,
    //     amount: u64
    // ) acquires Allowances, Capabilities {
    //     let spender_address = signer::address_of(spender);

    //     let allowances = borrow_global_mut<Allowances>(@TitanPower);
    //     assert!(
    //         table::contains(&allowances.allowances, owner),
    //         ERR_NOT_APPROVED_ADD
    //     );

    //     let owner_allowances = table::borrow_mut(&mut allowances.allowances, owner);
    //     assert!(
    //         table::contains(owner_allowances, spender_address),
    //         ERR_NOT_APPROVED_BALANCE
    //     );

    //     let spender_allowance = table::borrow_mut(owner_allowances, spender_address);
    //     assert!(*spender_allowance >= amount, ERR_INSUFFICIENT_ALLOWANCE);

    //     *spender_allowance = *spender_allowance - amount;

    //     let capabilities = borrow_global<Capabilities>(@TitanPower);

    //     // assert!(coin::balance<UserCoin>(owner) >= amount, ERR_INSUFFICIENT_BALANCE);

    //     coin::burn_from<UserCoin>(owner, amount, &capabilities.burn_cap);

    //     let coins_to_mint = coin::mint(amount, &capabilities.mint_cap);
    //     coin::deposit(recipient, coins_to_mint);
    // }

    public entry fun update_whitelist(
        admin: &signer,
        address_to_update: address,
        is_add: bool
    ) acquires Whitelist {
        assert!(
            signer::address_of(admin) == @TitanPower,
            ERR_NOT_ADMIN
        );
        let whitelist_ref = borrow_global_mut<Whitelist>(@TitanPower);
        let whitelist = &mut whitelist_ref.whitelist;

        if (is_add) {
            if (!vector::contains(whitelist, &address_to_update)) {
                vector::push_back(whitelist, address_to_update);
            }
        } else {
            let (is_in, index) = vector::index_of(whitelist, &address_to_update);
            if (is_in) {
                vector::remove(whitelist, index);
            }
        }
    }

    #[view]
    public fun is_account_registered(addr: address): bool {
        coin::is_account_registered<UserCoin>(addr)
    }

    #[view]
    public fun is_in_whitelist(addr: address): bool acquires Whitelist {
        let whitelist = borrow_global<Whitelist>(@TitanPower).whitelist;
        vector::contains(&whitelist, &addr)
    }

    #[view]
    public fun get_all_whitelist(): vector<address> acquires Whitelist {
        borrow_global<Whitelist>(@TitanPower).whitelist
    }

    #[view]
    public fun get_allowance(owner: address, spender: address): u64 acquires Allowances {
        let allowancesOps = borrow_global<Allowances>(@TitanPower);
        if(!table::contains(&allowancesOps.allowances, owner)) {
            return 0
        };

        let owner_allowances = table::borrow(&allowancesOps.allowances, owner);
        if(!table::contains(owner_allowances, spender)) {
            return 0
        };

        *table::borrow(owner_allowances, spender)
    }
}
