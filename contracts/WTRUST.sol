// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WTRUST - Wrapped tTRUST with EIP-2612 Permit Support
 * @notice Wraps native tTRUST into ERC20 with gasless approval via permits
 */
contract WTRUST is ERC20, ERC20Permit, ReentrancyGuard {
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    constructor() ERC20("Wrapped tTRUST", "WTRUST") ERC20Permit("Wrapped tTRUST") {}

    /**
     * @notice Wrap native tTRUST into WTRUST
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "WTRUST: Amount must be greater than 0");
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Unwrap WTRUST back to native tTRUST
     * @param amount Amount of WTRUST to unwrap
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "WTRUST: Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "WTRUST: Insufficient balance");
        
        _burn(msg.sender, amount);
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "WTRUST: Transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Allow deposits via receive function
     */
    receive() external payable {
        if (msg.value > 0) {
            _mint(msg.sender, msg.value);
            emit Deposit(msg.sender, msg.value);
        }
    }

    /**
     * @notice Get the amount of native tTRUST backing this contract
     */
    function totalUnderlying() external view returns (uint256) {
        return address(this).balance;
    }
}