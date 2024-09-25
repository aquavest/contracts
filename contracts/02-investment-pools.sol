// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FishToken} from "./01-fish-token.sol";

contract InvestmentPools is Ownable {
    struct Pool {
        uint256 fishBalance;
        uint256 usdcBalance;
        uint256 maxFishTokens;
    }

    uint256 public exchangeRate;
    FishToken public fishToken;
    IERC20 public usdcToken;
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;

    event UserDeposited(
        uint256 indexed poolId,
        address indexed user,
        uint256 fishAmount
    );
    event UserWithdraw(
        uint256 indexed poolId,
        address indexed user,
        uint256 fishAmount
    );
    event PoolWithdrawn(
        uint256 indexed poolId,
        address indexed recipient,
        uint256 usdcAmount
    );
    event MaxFishTokensUpdated(uint256 indexed poolId, uint256 maxFishTokens);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        IERC20 _usdcToken,
        uint256 _exchangeRate
    ) Ownable(msg.sender) {
        fishToken = new FishToken(tokenName, tokenSymbol);
        usdcToken = _usdcToken;
        exchangeRate = _exchangeRate;
    }

    function createPool(uint256 _maxFishTokens) external onlyOwner {
        pools[poolCount] = Pool({
            fishBalance: 0,
            usdcBalance: 0,
            maxFishTokens: _maxFishTokens
        });
        poolCount++;
    }

    function setExchangeRate(uint256 newRate) external onlyOwner {
        exchangeRate = newRate;
    }

    function setMaxFishTokens(
        uint256 poolId,
        uint256 _maxFishTokens
    ) external onlyOwner {
        pools[poolId].maxFishTokens = _maxFishTokens;
        emit MaxFishTokensUpdated(poolId, _maxFishTokens);
    }

    function purchaseTokens(uint256 usdcAmount) external {
        require(usdcAmount > 0, "Amount must be greater than zero");

        usdcToken.transferFrom(msg.sender, address(this), usdcAmount);
        fishToken.mint(msg.sender, usdcAmount * exchangeRate);
    }

    function returnTokens(uint256 fishAmount) external {
        require(fishAmount > 0, "Amount must be greater than zero");

        fishToken.burnFrom(msg.sender, fishAmount);
        usdcToken.transfer(msg.sender, fishAmount / exchangeRate);
    }

    function userDeposit(uint256 poolId, uint256 fishAmount) external {
        require(fishAmount > 0, "Amount must be greater than zero");

        Pool storage pool = pools[poolId];
        require(
            pool.fishBalance + fishAmount <= pool.maxFishTokens,
            "Exceeds max FISH tokens allowed"
        );

        pool.fishBalance += fishAmount;
        fishToken.transferFrom(msg.sender, address(this), fishAmount);

        emit UserDeposited(poolId, msg.sender, fishAmount);
    }

    function userWithdraw(uint256 poolId, uint256 fishAmount) external {
        require(fishAmount > 0, "Amount must be greater than zero");

        Pool storage pool = pools[poolId];

        pool.fishBalance -= fishAmount;
        fishToken.transfer(msg.sender, fishAmount);

        emit UserWithdraw(poolId, msg.sender, fishAmount);
    }

    function withdrawPool(
        uint256 poolId,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");

        Pool storage pool = pools[poolId];
        require(pool.usdcBalance >= amount, "Insufficient USDC balance");

        pool.usdcBalance -= amount;
        usdcToken.transfer(recipient, amount);

        emit PoolWithdrawn(poolId, recipient, amount);
    }
}
