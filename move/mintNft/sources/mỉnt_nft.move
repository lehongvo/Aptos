module MintNft::mint_nft {
    use aptos_framework::fungible_asset::{
        Self,
        MintRef,
        TransferRef,
        BurnRef,
        Metadata,
        FungibleAsset
    };
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use std::error;
    use std::signer;
    use std::string::utf8;
    use std::option;
    use std::debug::print;

    const ENOT_OWNER: u64 = 1;
    const ASSET_SYMBOL: vector<u8> = b"FA";

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }

    public fun init_module(admin: &signer) {
        let constructor_ref = &object::create_named_object(admin, ASSET_SYMBOL);
        print(&constructor_ref)
    }

    #[test]
    fun test_mint() {
        let admin = @0x01;
        let user1 = account::create_account_for_test(address1);

        init_module(&user1);
    }
}
