module coin_address::token_erc20 {
    use std::signer;
    use std::string::utf8;
    use std::vector;

    use aptos_framework::coin::{
        Self,
        MintCapability,
        BurnCapability
    };

    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_COIN_INITIALIZED: u64 = 2;
    const ERR_COIN_NOT_INITIALIZED: u64 = 3;
    const ERR_NOT_IN_WHITELIST: u64 = 4;

    struct UserCoin {}

    struct Capabilities has key {
        mint_cap: MintCapability<UserCoin>,
        burn_cap: BurnCapability<UserCoin>,
    }

    struct Whitelist has key {
        whitelist: vector<address>,
    }

    public entry fun initialize(coin_admin: &signer, initial_whitelist: vector<address>) {
        assert!(
            signer::address_of(coin_admin) == @coin_address,
            ERR_NOT_ADMIN
        );

        assert!(
            !coin::is_coin_initialized<UserCoin>(),
            ERR_COIN_INITIALIZED
        );

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<UserCoin>(
            coin_admin,
            utf8(b"Titan-Power"),
            utf8(b"TITAN"),
            8,
            true
        );

        coin::destroy_freeze_cap(freeze_cap);
        let caps = Capabilities {mint_cap, burn_cap};
        move_to(coin_admin, caps);
        move_to(coin_admin, Whitelist {whitelist: initial_whitelist});
    }

    public entry fun register(userAddress: &signer) {
        coin::register<UserCoin>(userAddress);
    }

    public entry fun mint(
        coin_admin: &signer,
        to_address: address,
        amount: u64
    ) acquires Capabilities, Whitelist {
        assert!(
            signer::address_of(coin_admin) == @coin_address,
            ERR_NOT_ADMIN
        );

        assert!(
            coin::is_coin_initialized<UserCoin>(),
            ERR_COIN_NOT_INITIALIZED
        );

        let whitelist = borrow_global<Whitelist>(@coin_address).whitelist;
        assert!(
            vector::contains(&whitelist, &to_address),
            ERR_NOT_IN_WHITELIST
        );

        let caps = borrow_global<Capabilities>(@coin_address);
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
        let caps = borrow_global<Capabilities>(@coin_address);
        
        coin::burn(coin, &caps.burn_cap);
    }

    public entry fun update_whitelist(
        admin: &signer, 
        address_to_update: address, 
        is_add: bool
    ) acquires Whitelist {
        assert!(
            signer::address_of(admin) == @coin_address,
            ERR_NOT_ADMIN
        );
        let whitelist_ref = borrow_global_mut<Whitelist>(@coin_address);
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
        let whitelist = borrow_global<Whitelist>(@coin_address).whitelist;
        vector::contains(&whitelist, &addr)
    }

    #[view]
    public fun get_all_whitelist(): vector<address> acquires Whitelist {
        borrow_global<Whitelist>(@coin_address).whitelist
    }
}
