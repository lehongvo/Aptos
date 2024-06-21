module my_addrx::Example {
    use std::debug::print;

    public fun main() {
        let number: u64 = 10;
        print(&number)
    }

    #[test]
    public fun test() {
        main();
    }
}
