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
  it("Should allow owner to withdraw USDC from a pool", async () => {});
});
