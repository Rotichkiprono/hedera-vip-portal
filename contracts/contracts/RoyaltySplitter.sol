// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IHederaTokenService
 * @notice Minimal interface for the Hedera Token Service (HTS) system precompile at 0x167.
 */
interface IHederaTokenService {
    /**
     * @dev Transfers tokens where the calling contract has authorization or holds treasury balance.
     * @param token The EVM address of the HTS token (0x0000000000000000000000000000000000XXXXXX)
     * @param sender The address sending the token
     * @param receiver The address receiving the token
     * @param amount The number of tokens to transfer
     * @return responseCode Hedera response code (22 = SUCCESS)
     */
    function transferToken(
        address token,
        address sender,
        address receiver,
        int64 amount
    ) external returns (int64 responseCode);
}

/**
 * @title RoyaltySplitter
 * @notice Handles automated revenue distribution for ticket sales and natively 
 * triggers HTS VIP token transfers via the Hedera 0x167 precompile.
 */
contract RoyaltySplitter {
    // Hedera Token Service system precompile address
    address constant HTS_PRECOMPILE = address(0x167);
    int64 constant HEDERA_SUCCESS = 22;
    uint256 constant BASIS_POINTS_DENOMINATOR = 10000; // 100.00%

    address public owner;
    address public treasuryAccount;
    address public htsTokenAddress;
    uint256 public ticketPriceHbar;

    struct Payee {
        address account;
        uint256 shareBps; // Share in basis points (e.g., 7000 = 70%)
    }

    Payee[] public payees;

    event TicketPurchased(address indexed buyer, uint256 amountPaid, address indexed tokenAddress);
    event RoyaltyDistributed(address indexed payee, uint256 amount);
    event PayeesUpdated(uint256 totalPayees);

    modifier onlyOwner() {
        require(msg.sender == owner, "RoyaltySplitter: Caller is not owner");
        _;
    }

    /**
     * @param _payees Array of recipient wallet addresses
     * @param _sharesBps Array of corresponding shares in basis points (must sum to 10,000)
     * @param _treasuryAccount Address holding the HTS token supply
     * @param _htsTokenAddress EVM address format of the HTS token ID
     * @param _ticketPriceHbar Ticket price in Wei/Tinybar equivalent
     */
    constructor(
        address[] memory _payees,
        uint256[] memory _sharesBps,
        address _treasuryAccount,
        address _htsTokenAddress,
        uint256 _ticketPriceHbar
    ) {
        require(_payees.length == _sharesBps.length, "RoyaltySplitter: Mismatched input lengths");
        require(_treasuryAccount != address(0), "RoyaltySplitter: Invalid treasury");

        owner = msg.sender;
        treasuryAccount = _treasuryAccount;
        htsTokenAddress = _htsTokenAddress;
        ticketPriceHbar = _ticketPriceHbar;

        _setPayees(_payees, _sharesBps);
    }

    /**
     * @notice Primary entry point to purchase a VIP Ticket using HBAR.
     * Splits funds across payees and transfers 1 HTS token from treasury to recipient.
     * @param recipient The EVM address receiving the HTS token
     */
    function purchaseTicket(address recipient) external payable {
        require(msg.value >= ticketPriceHbar, "RoyaltySplitter: Insufficient HBAR sent");
        require(recipient != address(0), "RoyaltySplitter: Invalid recipient");

        // 1. Distribute funds to payees according to basis points
        uint256 totalDistributed = 0;
        for (uint256 i = 0; i < payees.length; i++) {
            uint256 payeeAmount = (msg.value * payees[i].shareBps) / BASIS_POINTS_DENOMINATOR;
            if (payeeAmount > 0) {
                totalDistributed += payeeAmount;
                (bool success, ) = payable(payees[i].account).call{value: payeeAmount}("");
                require(success, "RoyaltySplitter: Failed to send HBAR to payee");
                emit RoyaltyDistributed(payees[i].account, payeeAmount);
            }
        }

        // Refund any remaining dust balance to buyer
        uint256 remainder = msg.value - totalDistributed;
        if (remainder > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: remainder}("");
            require(refundSuccess, "RoyaltySplitter: Refund failed");
        }

        // 2. Interact with Hedera 0x167 Precompile to transfer the HTS VIP token
        int64 response = IHederaTokenService(HTS_PRECOMPILE).transferToken(
            htsTokenAddress,
            treasuryAccount,
            recipient,
            1
        );

        require(response == HEDERA_SUCCESS, "RoyaltySplitter: HTS precompile transfer failed");

        emit TicketPurchased(recipient, msg.value, htsTokenAddress);
    }

    /**
     * @notice Allows updating payout splits for future sales.
     */
    function setPayees(address[] memory _payees, uint256[] memory _sharesBps) external onlyOwner {
        require(_payees.length == _sharesBps.length, "RoyaltySplitter: Mismatched input lengths");
        delete payees;
        _setPayees(_payees, _sharesBps);
    }

    function _setPayees(address[] memory _payees, uint256[] memory _sharesBps) internal {
        uint256 totalBps = 0;
        for (uint256 i = 0; i < _payees.length; i++) {
            require(_payees[i] != address(0), "RoyaltySplitter: Invalid payee address");
            payees.push(Payee({account: _payees[i], shareBps: _sharesBps[i]}));
            totalBps += _sharesBps[i];
        }
        require(totalBps == BASIS_POINTS_DENOMINATOR, "RoyaltySplitter: Shares must sum to 10000");
        emit PayeesUpdated(_payees.length);
    }

    /**
     * @notice Update target HTS token address or treasury
     */
    function updateTokenConfiguration(address _htsTokenAddress, address _treasuryAccount, uint256 _ticketPriceHbar) external onlyOwner {
        htsTokenAddress = _htsTokenAddress;
        treasuryAccount = _treasuryAccount;
        ticketPriceHbar = _ticketPriceHbar;
    }

    /**
     * @notice Helper to check configured payees count
     */
    function getPayeesCount() external view returns (uint256) {
        return payees.length;
    }
}