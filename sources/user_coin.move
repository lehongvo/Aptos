module coin_address::user_coin {
    use std::signer;
    use std::string::utf8;

    use aptos_framework::coin::{
        Self,
        MintCapability,
        BurnCapability
    };

    const ERR_NOT_ADMIN: u64 = 1;
    const ERR_COIN_INITIALIZED: u64 = 2;
    const ERR_COIN_NOT_INITIALIZED: u64 = 2;

    struct UserCoin {}

    struct Capabilities has key {
        mint_cap: MintCapability<UserCoin>,
        burn_cap: BurnCapability<UserCoin>,
    }

    public entry fun initialize(coin_admin: &signer) {
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
    }

    public entry fun register(userAddress: signer) {
        coin::register<UserCoin>(&userAddress);
    }

    public entry fun mint(
        coin_admin: &signer,
        to_address: address,
        amount: u64
    ) acquires Capabilities {
        assert!(
            signer::address_of(coin_admin) == @coin_address,
            ERR_NOT_ADMIN
        );

        assert!(
            coin::is_coin_initialized<UserCoin>(),
            ERR_COIN_INITIALIZED
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
            ERR_COIN_INITIALIZED
        );

        let coin = coin::withdraw<UserCoin>(user, amount);
        let caps = borrow_global<Capabilities>(@coin_address);
        
        coin::burn(coin, &caps.burn_cap);
    }
}
