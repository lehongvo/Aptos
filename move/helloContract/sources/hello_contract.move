module HelloContract::hello_contract {
    use std::error;
    use std::signer;
    use std::string;
    use aptos_framework::account;
    use aptos_framework::event;

    struct MessageHolder has key {
        message: string::String,
        message_change_events: event::EventHandle<MessageChangeEvent>,
    }

    struct MessageChangeEvent has drop, store {
        from_message: string::String,
        to_message: string::String,
    }

    const ENO_MESSAGE: u64 = 0;

    struct DeployData has key, copy, drop {
        addr: address,
        age: u64,
        name: string::String,
    }

    fun init_module(
        address_signer: &signer, 
    ) {
        move_to(
            address_signer,
            DeployData {
                addr: signer::address_of(address_signer),
                age: 20,
                name: string::utf8(b"Vo Le Hong")
            }
        )
    }
    
    #[view]
    public fun get_deploy_info(addr: address): DeployData acquires DeployData {
        *borrow_global<DeployData>(addr)
    }

    #[view]
    public fun get_message(addr: address): string::String acquires MessageHolder {
        assert!(exists<MessageHolder>(addr), error::not_found(ENO_MESSAGE));
        *&borrow_global<MessageHolder>(addr).message
    }

    public entry fun set_message(acc: &signer, message: string::String) acquires MessageHolder {
        let account_address = signer::address_of(acc);
        if(!exists<MessageHolder>(account_address)) {
            move_to(acc, MessageHolder {
                message,
                message_change_events: account::new_event_handle<MessageChangeEvent>(acc),
            })
        } else {
            let old_message_holder = borrow_global_mut<MessageHolder>(account_address);
            let old_message = old_message_holder.message;
            event::emit_event(&mut old_message_holder.message_change_events, MessageChangeEvent {from_message: old_message, to_message: message});
            old_message_holder.message = message
        }
    }

    #[test_only]
    public fun test_only_init_module(account: &signer) {
        init_module(account);
    }
}
