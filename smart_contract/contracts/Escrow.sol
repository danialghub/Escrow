// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Escrow {
    address public buyer;
    address public seller;
    address public arbiter;

    uint256 public amount;

    enum State {
        AWAITING_PAYMENT,
        AWAITING_DELIVERY
    }
    State public currentState;

    event EscrowSet(address indexed seller, address indexed arbiter);
    event Funded(address indexed buyer, uint256 amount);
    event Released(address indexed to, uint256 amount);
    event Refunded(address indexed to, uint256 amount);
    event SessionReset(address oldBuyer, uint256 timestamp);

    uint8 private unlocked = 1;
    modifier nonReentrant() {
        require(unlocked == 1, "Reentrant");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    modifier inState(State expected) {
        require(currentState == expected, "Invalid state");
        _;
    }

    modifier onlyBuyerOrArbiter() {
        require(
            msg.sender == buyer || msg.sender == arbiter,
            "Only buyer or arbiter"
        );
        _;
    }

    modifier onlySellerOrArbiter() {
        require(
            msg.sender == seller || msg.sender == arbiter,
            "Only seller or arbiter"
        );
        _;
    }

    constructor() {
        currentState = State.AWAITING_PAYMENT;
    }

    // --------------------------------------------
    // Setup SESSION
    // --------------------------------------------
    function setupEscrow(address _seller, address _arbiter) public {
        require(currentState == State.AWAITING_PAYMENT, "Active escrow exists");

        seller = _seller;
        arbiter = _arbiter;
        buyer = msg.sender;
        amount = 0;

        emit EscrowSet(_seller, _arbiter);
    }

    // --------------------------------------------
    // DEPOSIT
    // --------------------------------------------
    function deposit()
        external
        payable
        inState(State.AWAITING_PAYMENT)
        nonReentrant
    {
        require(msg.value > 0, "Must send ether");
        require(buyer != address(0), "buyer not set");
        require(seller != address(0), "Seller not set");
        require(arbiter != address(0), "Arbiter not set");

        amount = msg.value;
        currentState = State.AWAITING_DELIVERY;

        emit Funded(msg.sender, msg.value);
    }

    // --------------------------------------------
    // RELEASE
    // --------------------------------------------
    function release()
        external
        onlyBuyerOrArbiter
        inState(State.AWAITING_DELIVERY)
        nonReentrant
    {
        require(amount > 0, "No funds to release");
        uint256 payment = amount;
        amount = 0;

        (bool ok, ) = payable(seller).call{value: payment}("");
        require(ok, "Transfer failed");

        emit Released(seller, payment);

        _finishAndReset();
    }

    // --------------------------------------------
    // REFUND
    // --------------------------------------------

    function refund()
        external
        onlySellerOrArbiter
        inState(State.AWAITING_DELIVERY)
        nonReentrant
    {
        require(amount > 0, "No funds to release");

        uint256 payment = amount;
        amount = 0;

        (bool ok, ) = payable(buyer).call{value: payment}("");
        require(ok, "Refund failed");

        emit Refunded(buyer, payment);

        // reset for next transaction
        _finishAndReset();
    }

    function _finishAndReset() private {
        emit SessionReset(buyer, block.timestamp);

        buyer = address(0);
        seller = address(0);
        arbiter = address(0);
        currentState = State.AWAITING_PAYMENT;
        amount = 0;
    }

    receive() external payable {
        revert("Use deposit()");
    }
    fallback() external payable {
        revert("Use deposit()");
    }
}
