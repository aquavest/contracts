import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem } from "hardhat";
import { parseEther, parseUnits } from "viem";

describe("FishToken and InvestmentPools", () => {
  async function deployContractsFixture() {
    const publicClient = await viem.getPublicClient();
    const [owner, user1, user2] = await viem.getWalletClients();

    const mockUSDC = await viem.deployContract("MockUSDC");

    const investmentPools = await viem.deployContract("InvestmentPools", [
      "FishToken",
      "FISH",
      mockUSDC.address,
      BigInt(10 ** 12), // Set exchange rate to 10^12 (1 USDC = 1 FISH, accounting for decimal difference)
    ]);

    const fishTokenAddress = await investmentPools.read.fishToken();
    const fishToken = await viem.getContractAt("FishToken", fishTokenAddress);

    return {
      publicClient,
      owner,
      user1,
      user2,
      mockUSDC,
      investmentPools,
      fishToken,
    };
  }

  it("Should deploy contracts correctly", async () => {
    const { investmentPools, fishToken, mockUSDC } = await loadFixture(
      deployContractsFixture
    );

    expect((await investmentPools.read.fishToken()).toLowerCase()).to.equal(
      fishToken.address.toLowerCase()
    );
    expect((await investmentPools.read.usdcToken()).toLowerCase()).to.equal(
      mockUSDC.address.toLowerCase()
    );
    expect(await investmentPools.read.exchangeRate()).to.equal(
      BigInt(10 ** 12)
    );
  });

  it("Should allow users to purchase tokens", async () => {
    const { investmentPools, mockUSDC, fishToken, user1 } = await loadFixture(
      deployContractsFixture
    );

    const usdcAmount = parseUnits("100", 6); // 100 USDC with 6 decimals
    await mockUSDC.write.mint([user1.account.address, usdcAmount]);
    await mockUSDC.write.approve([investmentPools.address, usdcAmount], {
      account: user1.account.address,
    });

    await investmentPools.write.purchaseTokens([usdcAmount], {
      account: user1.account.address,
    });

    const fishBalance = await fishToken.read.balanceOf([user1.account.address]);
    const expectedFishAmount = usdcAmount * BigInt(10 ** 12); // Convert from 6 to 18 decimals

    expect(fishBalance).to.equal(expectedFishAmount);
  });

  it("Should allow users to return tokens", async () => {
    const { investmentPools, mockUSDC, fishToken, user1 } = await loadFixture(
      deployContractsFixture
    );

    const usdcAmount = parseUnits("100", 6);
    const fishAmount = parseUnits("100", 6);

    await mockUSDC.write.mint([user1.account.address, usdcAmount]);
    await mockUSDC.write.approve([investmentPools.address, usdcAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.purchaseTokens([usdcAmount], {
      account: user1.account.address,
    });

    const returnAmount = parseUnits("50", 18);
    await fishToken.write.approve([investmentPools.address, returnAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.returnTokens([returnAmount], {
      account: user1.account.address,
    });

    const fishBalance = await fishToken.read.balanceOf([user1.account.address]);
    expect(fishBalance).to.equal(parseUnits("50", 18));
  });

  it("Should allow users to deposit into a pool", async () => {
    const { investmentPools, mockUSDC, fishToken, owner, user1 } =
      await loadFixture(deployContractsFixture);

    await investmentPools.write.createPool([parseUnits("1000", 6)], {
      account: owner.account.address,
    });

    const usdcAmount = parseUnits("100", 6);
    await mockUSDC.write.mint([user1.account.address, usdcAmount]);
    await mockUSDC.write.approve([investmentPools.address, usdcAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.purchaseTokens([usdcAmount], {
      account: user1.account.address,
    });

    const fishAmount = parseUnits("50", 6);
    await fishToken.write.approve([investmentPools.address, fishAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.userDeposit([0n, fishAmount], {
      account: user1.account.address,
    });

    const pool = await investmentPools.read.pools([0n]);
    expect(pool[0]).to.equal(fishAmount); // fishBalance
  });

  it("Should allow users to withdraw from a pool", async () => {
    const { investmentPools, mockUSDC, fishToken, owner, user1 } =
      await loadFixture(deployContractsFixture);

    await investmentPools.write.createPool([parseUnits("1000", 6)], {
      account: owner.account.address,
    });

    const usdcAmount = parseUnits("100", 6);
    await mockUSDC.write.mint([user1.account.address, usdcAmount]);
    await mockUSDC.write.approve([investmentPools.address, usdcAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.purchaseTokens([usdcAmount], {
      account: user1.account.address,
    });

    const fishAmount = parseUnits("50", 6);
    await fishToken.write.approve([investmentPools.address, fishAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.userDeposit([0n, fishAmount], {
      account: user1.account.address,
    });

    await investmentPools.write.userWithdraw([0n, fishAmount], {
      account: user1.account.address,
    });

    const pool = await investmentPools.read.pools([0n]);
    expect(pool[0]).to.equal(0n); // fishBalance
  });
  
  it("Should allow owner to withdraw USDC from a pool", async () => {
    const { investmentPools, mockUSDC, fishToken, owner, user1 } = await loadFixture(deployContractsFixture);
  
    // Create a pool with a higher max FISH tokens limit
    const maxFishTokens = parseUnits("1000", 18); // 1000 FISH tokens (18 decimals)
    await investmentPools.write.createPool([maxFishTokens], {
      account: owner.account.address,
    });
  
    // User purchases FISH tokens
    const usdcAmount = parseUnits("100", 6); // 100 USDC
    await mockUSDC.write.mint([user1.account.address, usdcAmount]);
    await mockUSDC.write.approve([investmentPools.address, usdcAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.purchaseTokens([usdcAmount], {
      account: user1.account.address,
    });
  
    // User deposits FISH tokens into the pool
    const fishAmount = parseUnits("50", 18); // 50 FISH tokens (18 decimals)
    await fishToken.write.approve([investmentPools.address, fishAmount], {
      account: user1.account.address,
    });
    await investmentPools.write.userDeposit([0n, fishAmount], {
      account: user1.account.address,
    });
  
    // Check pool's USDC balance before withdrawal
    const poolBefore = await investmentPools.read.pools([0n]);
    expect(poolBefore[1]).to.equal(parseUnits("50", 6)); // 50 USDC (6 decimals)
  
    // Owner withdraws USDC from the pool
    const withdrawAmount = parseUnits("25", 6); // 25 USDC
    const ownerUsdcBalanceBefore = await mockUSDC.read.balanceOf([owner.account.address]);
  
    await investmentPools.write.withdrawPool([0n, owner.account.address, withdrawAmount], {
      account: owner.account.address,
    });
  
    // Check pool's USDC balance after withdrawal
    const poolAfter = await investmentPools.read.pools([0n]);
    expect(poolAfter[1]).to.equal(parseUnits("25", 6)); // 25 USDC left in the pool
  
    // Check owner's USDC balance
    const ownerUsdcBalanceAfter = await mockUSDC.read.balanceOf([owner.account.address]);
    expect(ownerUsdcBalanceAfter - ownerUsdcBalanceBefore).to.equal(withdrawAmount);
  });
});
