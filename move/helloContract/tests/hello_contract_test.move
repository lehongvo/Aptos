// #[test_only]
// module HelloContract::HelloContract_test {
//     use aptos_framework::account;
//     use std::signer;

//     use HelloContract::hello_contract::{ Self };

//     const ENO_MESSAGE: u64 = 0;

//     #[test(HelloContract = @HelloContract)]
//     fun test_set_message(HelloContract: signer) {
//         let addr = signer::address_of(&HelloContract);
//         account::create_account_for_test(addr);

//         hello_contract::test_only_init_module(&HelloContract);

//         let message = string::utf8(b"Hello, Blockchain");
//         hello_contract::set_message(&HelloContract, message);

//         let current_message = hello_contract::get_message(addr);
//         assert!(
//             current_message == message,
//             ENO_MESSAGE
//         );
//     }
// }
