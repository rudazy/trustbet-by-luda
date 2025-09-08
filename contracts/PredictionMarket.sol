// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./WTRUST.sol";

/**
 * @title PredictionMarket - Binary prediction market with gasless betting
 * @notice Users bet YES/NO using WTRUST with EIP-2612 permits for gasless transactions
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    struct Market {
        string question;
        uint256 closeTime;
        uint256 yesPool;
        uint256 noPool;
        bool resolved;
        bool outcome; // true = YES wins, false = NO wins
        mapping(address => uint256) yesBets;
        mapping(address => uint256) noBets;
        mapping(address => bool) claimed;
    }

    WTRUST public immutable wTrust;
    address public resolver;
    uint256 public bettingFee = 500; // 5% (basis points)
    uint256 public treasuryFee = 200; // 2% on winnings (basis points)
    uint256 public nextMarketId = 1;
    uint256 public totalFeesCollected;
    
    mapping(uint256 => Market) public markets;

    event MarketCreated(uint256 indexed marketId, string question, uint256 closeTime);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool side, uint256 amount, uint256 fee);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event Claimed(uint256 indexed marketId, address indexed user, uint256 payout);

    error MarketClosed();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error OnlyResolver();
    error NothingToClaim();
    error AlreadyClaimed();
    error InvalidAmount();

    constructor(address payable _wTrust, address _resolver) Ownable(msg.sender) {
        wTrust = WTRUST(_wTrust);
        resolver = _resolver;
    }

    /**
     * @notice Create a new prediction market
     */
    function createMarket(string calldata question, uint256 closeTime) external onlyOwner returns (uint256) {
        require(closeTime > block.timestamp, "Close time must be in future");
        
        uint256 marketId = nextMarketId++;
        Market storage market = markets[marketId];
        market.question = question;
        market.closeTime = closeTime;
        
        emit MarketCreated(marketId, question, closeTime);
        return marketId;
    }

    /**
     * @notice Place bet using permit (gasless for user) with 5% betting fee
     */
    function betWithPermit(
        uint256 marketId,
        bool side, // true = YES, false = NO
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        Market storage market = markets[marketId];
        require(block.timestamp < market.closeTime, "Market closed");
        require(!market.resolved, "Market resolved");
        require(amount > 0, "Amount must be > 0");

        // Execute permit
        IERC20Permit(address(wTrust)).permit(msg.sender, address(this), amount, deadline, v, r, s);
        
        // Transfer tokens
        wTrust.transferFrom(msg.sender, address(this), amount);

        // Calculate 5% betting fee
        uint256 fee = (amount * bettingFee) / 10000; // 5% = 500 basis points
        uint256 betAmount = amount - fee;

        // Add fee to total collected
        totalFeesCollected += fee;

        // Record bet (after fee deduction)
        if (side) {
            market.yesPool += betAmount;
            market.yesBets[msg.sender] += betAmount;
        } else {
            market.noPool += betAmount;
            market.noBets[msg.sender] += betAmount;
        }

        emit BetPlaced(marketId, msg.sender, side, betAmount, fee);
    }

    /**
     * @notice Resolve market outcome
     */
    function resolveMarket(uint256 marketId, bool outcome) external {
        require(msg.sender == resolver || msg.sender == owner(), "Only resolver or owner");
        Market storage market = markets[marketId];
        require(block.timestamp >= market.closeTime, "Market not closed yet");
        require(!market.resolved, "Already resolved");

        market.resolved = true;
        market.outcome = outcome;

        emit MarketResolved(marketId, outcome);
    }

    /**
     * @notice Claim winnings after market resolution
     */
    function claim(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");
        require(!market.claimed[msg.sender], "Already claimed");

        uint256 userBet = market.outcome ? market.yesBets[msg.sender] : market.noBets[msg.sender];
        require(userBet > 0, "No winning bet");

        uint256 winningPool = market.outcome ? market.yesPool : market.noPool;
        uint256 losingPool = market.outcome ? market.noPool : market.yesPool;
        
        if (losingPool == 0) {
            // No losing bets, return original bet
            market.claimed[msg.sender] = true;
            wTrust.transfer(msg.sender, userBet);
            emit Claimed(marketId, msg.sender, userBet);
            return;
        }

        // Calculate payout: original bet + share of losing pool minus treasury fee
        uint256 treasuryAmount = (losingPool * treasuryFee) / 10000;
        uint256 payoutPool = losingPool - treasuryAmount;
        uint256 payout = userBet + (payoutPool * userBet) / winningPool;

        market.claimed[msg.sender] = true;
        wTrust.transfer(msg.sender, payout);

        emit Claimed(marketId, msg.sender, payout);
    }

    /**
     * @notice Get market details
     */
    function getMarket(uint256 marketId) external view returns (
        string memory question,
        uint256 closeTime,
        uint256 yesPool,
        uint256 noPool,
        bool resolved,
        bool outcome
    ) {
        Market storage market = markets[marketId];
        return (market.question, market.closeTime, market.yesPool, market.noPool, market.resolved, market.outcome);
    }

    /**
     * @notice Get user's bets in a market
     */
    function getUserBets(uint256 marketId, address user) external view returns (uint256 yesBet, uint256 noBet, bool claimed) {
        Market storage market = markets[marketId];
        return (market.yesBets[user], market.noBets[user], market.claimed[user]);
    }

    /**
     * @notice Set resolver address
     */
    function setResolver(address _resolver) external onlyOwner {
        resolver = _resolver;
    }

    /**
     * @notice Set betting fee (basis points)
     */
    function setBettingFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        bettingFee = _fee;
    }

    /**
     * @notice Set treasury fee (basis points)
     */
    function setTreasuryFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        treasuryFee = _fee;
    }

    /**
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 fees = totalFeesCollected;
        totalFeesCollected = 0;
        wTrust.transfer(owner(), fees);
    }

    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = wTrust.balanceOf(address(this));
        wTrust.transfer(owner(), balance);
    }
}