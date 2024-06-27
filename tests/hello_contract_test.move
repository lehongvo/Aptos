#[test_only]
module hello_contract::message_test {
    use aptos_framework::account;
    use std::signer;

    use hello_contract::message::{ Self };

    const ENO_MESSAGE: u64 = 0;

    #[test(hello_contract = @hello_contract)]
    fun test_set_message(hello_contract: signer) {
        let addr = signer::address_of(&hello_contract);
        account::create_account_for_test(addr);

        message::test_only_init_module(&hello_contract);

        let message = string::utf8(b"Hello, Blockchain");
        message::set_message(&hello_contract, message);

        let current_message = message::get_message(addr);
        assert!(
            current_message == message,
            ENO_MESSAGE
        );
    }
}
