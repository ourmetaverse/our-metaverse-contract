import { expect } from "chai";
import { ethers, waffle } from "hardhat";

// https://www.chaijs.com/
describe("OurMetaverse", function () {
  it("OurMetaverse init", async function () {
    const OurMetaverse = await ethers.getContractFactory("OurMetaverse");
    const ourm = await OurMetaverse.deploy(
      "https://ourmetaverse.github.io/meta.json#"
    );
    const provider = waffle.provider;
    const accounts = await ethers.getSigners();
    await ourm.deployed();
    expect(await ourm.isStarted()).to.equal(false);
    await expect(ourm.mint(1)).to.be.revertedWith("Not started");
    expect(
      ourm.mint(10, {
        value: ethers.utils.parseEther("0.1"),
      })
    ).to.be.revertedWith("Not started");

    await expect(ourm.buyBookToken()).to.be.revertedWith("Not started");
    await expect(ourm.buyMovieToken()).to.be.revertedWith("Not started");

    await ourm.init();
    expect(await ourm.ownerOf(0)).to.equal(ourm.address);
    expect(await ourm.ownerOf(1)).to.equal(ourm.address);
    expect(await ourm.ownerOf(2)).to.equal(accounts[0].address);
    expect(await provider.getBalance(ourm.address)).to.equal(0);
    expect(await ourm.balanceOf(ourm.address)).to.equal(2);
    expect(await ourm.balanceOf(accounts[0].address)).to.equal(598);
    await expect(ourm.mint(1)).to.be.revertedWith("Each address 10 mint");

    await expect(
      ourm.mint(
        ethers.BigNumber.from(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      )
    ).to.be.revertedWith("reverted with panic code 0x11");
    expect(await ourm.balanceOf(ourm.address)).to.equal(2);
  });

  it("OurMetaverse mint", async function () {
    const accounts = await ethers.getSigners();
    const OurMetaverse = await ethers.getContractFactory("OurMetaverse");
    const ourm = await OurMetaverse.deploy(
      "https://ourmetaverse.github.io/meta.json#"
    );
    await ourm.deployed();
    await ourm.init();
    const [ad1, ad2, ad3, ad4] = accounts;
    const provider = waffle.provider;

    // mint 11 token
    const ourm2 = ourm.connect(ad2);
    await expect(ourm2.connect(ad2).mint(1)).to.be.revertedWith(
      "Not enough ETH"
    );
    await ourm2.mint(1, {
      value: ethers.utils.parseEther("0.01"),
    });
    expect(await ourm2.balanceOf(ad2.address)).to.equal(1);
    await ourm2.mint(9, {
      value: ethers.utils.parseEther("0.09"),
    });
    expect(await ourm2.balanceOf(ad2.address)).to.equal(10);
    await expect(
      ourm2.mint(1, {
        value: ethers.utils.parseEther("0.1"),
      })
    ).to.be.revertedWith("Each address 10 mint");
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("0.1")
    );

    const ourm3 = ourm.connect(ad3);
    await ourm3.mint(1, {
      value: ethers.utils.parseEther("0.01"),
    });

    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("0.11")
    );

    // buy book
    const ourm4 = ourm.connect(ad4);
    await expect(
      ourm4.buyBookToken({
        value: ethers.utils.parseEther("29"),
      })
    ).to.revertedWith("Not enough ETH");

    await ourm4.buyBookToken({
      value: ethers.utils.parseEther("30"),
    });

    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("30.11")
    );

    // receive
    await ourm2.receiveRewardBalanceWithToken(600);
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("30.10")
    );
    await expect(ourm2.receiveRewardBalanceWithToken(600)).to.be.revertedWith(
      "No reward"
    );

    await ourm2.receiveRewardBalanceWithToken(601);
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("30.09")
    );

    // withdraw mint
    await ourm.receiveMintBalance();
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("29.98")
    );
    await ourm.receiveMintBalance();
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("29.98")
    );

    // receive with decimal
    await ad1.sendTransaction({
      to: ourm.address,
      from: ad1.address,
      value: ethers.utils.parseEther("1"),
    });
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("30.98")
    );
    await ourm2.receiveRewardBalanceWithToken(600);
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("30.979666666666666667")
    );
    await expect(ourm2.receiveRewardBalanceWithToken(600)).to.be.revertedWith(
      "No reward"
    );
    await ourm2.receiveRewardBalanceWithToken(602);
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("30.969333333333333334")
    );
    await ad1.sendTransaction({
      to: ourm.address,
      from: ad1.address,
      value: ethers.utils.parseEther("302"),
    });
    await ourm2.receiveRewardBalanceWithTokens([600, 602]);
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("332.768")
    );
    await expect(ourm2.receiveRewardBalanceWithToken(600)).to.be.revertedWith(
      "No reward"
    );
    await expect(
      ourm2.receiveRewardBalanceWithTokens([600, 602])
    ).to.be.revertedWith("No reward");

    // buy movie
    await expect(
      ourm3.buyBookToken({
        value: ethers.utils.parseEther("1"),
      })
    ).to.revertedWith("Has minted");

    await expect(
      ourm3.buyBookToken({
        value: ethers.utils.parseEther("30"),
      })
    ).to.revertedWith("Has minted");

    await expect(
      ourm3.buyMovieToken({
        value: ethers.utils.parseEther("599"),
      })
    ).to.revertedWith("Not enough ETH");
    await ourm3.buyMovieToken({
      value: ethers.utils.parseEther("900"),
    });
    expect(await provider.getBalance(ourm.address)).to.equal(
      ethers.utils.parseEther("1232.768")
    );
    await expect(
      ourm3.buyMovieToken({
        value: ethers.utils.parseEther("900"),
      })
    ).to.revertedWith("Has minted");
    expect(await ourm3.numberMinted(ad3.address)).to.equal(1);
    expect(await ourm3.balanceOf(ad3.address)).to.equal(2);
    await expect(
      ourm3.receiveRewardBalanceWithTokens([0, 610, 612])
    ).to.be.revertedWith("Too many tokens");

    await ourm2.receiveRewardBalanceWithToken(600);
    await ourm2.receiveRewardBalanceWithTokens([601, 602, 603]);
    expect(await provider.getBalance(ourm.address)).to.equal(
      // 1233 - 1233 / 3000 * 4
      ethers.utils.parseEther("1231.356")
    );
    await expect(
      ourm2.receiveRewardBalanceWithTokens([600, 601, 602, 603])
    ).to.be.revertedWith("No reward");
    await ourm2.receiveRewardBalanceWithTokens([600, 601, 602, 604, 604]);
    expect(await provider.getBalance(ourm.address)).to.equal(
      // 1233 - 1233 / 3000 * 5
      ethers.utils.parseEther("1230.945")
    );
    await ourm4.mint(9, {
      value: ethers.utils.parseEther("0.09"),
    });
    expect(await provider.getBalance(ourm.address)).to.equal(
      // 1230.945 + 0.09
      ethers.utils.parseEther("1231.035")
    );
    await ourm2.receiveRewardBalanceWithToken(605);
    expect(await provider.getBalance(ourm.address)).to.equal(
      // 1233 - 1233 / 3000 * 6 + 0.09
      ethers.utils.parseEther("1230.624")
    );
    await ourm.receiveMintBalance();
    expect(await provider.getBalance(ourm.address)).to.equal(
      // 1233 - 1233 / 3000 * 6
      ethers.utils.parseEther("1230.534")
    );

    // grant
    await expect(ourm2.grant(600, "")).to.revertedWith("Length overflow");
    await ourm2.grant(600, "0x0000000000000000000000000000000000000000");
    expect(await ourm2.getGrantsWithToken(600)).to.eql([
      "0x0000000000000000000000000000000000000000",
    ]);
    await expect(
      ourm2.grant(
        600,
        // 130 > 128
        "1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"
      )
    ).to.revertedWith("Length overflow");
    await expect(
      ourm2.grant(600, "0x0000000000000000000000000000000000000001")
    ).to.revertedWith("Not enough ETH");
    await ourm2.grant(600, "0x0000000000000000000000000000000000000001", {
      value: ethers.utils.parseEther("0.3"),
    });
    await ourm2.grant(600, "0x0000000000000000000000000000000000000002", {
      value: ethers.utils.parseEther("0.6"),
    });
    expect(await ourm2.getGrantsWithToken(600)).to.eql([
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
    ]);
    await expect(
      ourm2.grant(600, "0x0000000000000000000000000000000000000002", {
        value: ethers.utils.parseEther("0.6"),
      })
    ).to.revertedWith("Not enough ETH");

    await expect(
      ourm4.grant(601, "0x0000000000000000000000000000000000000000")
    ).to.revertedWith("Only holder");

    // grant book
    await ourm4.grant(1, "0x0000000000000000000000000000000000000000");
    expect(await ourm4.getGrantsWithToken(1)).to.eql([
      "0x0000000000000000000000000000000000000000",
    ]);
    await expect(
      ourm4.grant(1, "0x0000000000000000000000000000000000000002", {
        value: ethers.utils.parseEther("1"),
      })
    ).to.revertedWith("Not enough ETH");
    await ourm4.grant(1, "0x0000000000000000000000000000000000000002 book", {
      value: ethers.utils.parseEther("3"),
    });
    expect(await ourm4.getGrantsWithToken(1)).to.eql([
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000002 book",
    ]);

    // grant movie
    await ourm3.grant(0, "0x0000000000000000000000000000000000000000");
    expect(await ourm3.getGrantsWithToken(0)).to.eql([
      "0x0000000000000000000000000000000000000000",
    ]);
    await expect(
      ourm3.grant(0, "0x0000000000000000000000000000000000000002", {
        value: ethers.utils.parseEther("29"),
      })
    ).to.revertedWith("Not enough ETH");
    await ourm3.grant(0, "0x0000000000000000000000000000000000000002 movie", {
      value: ethers.utils.parseEther("30"),
    });
    expect(await ourm3.getGrantsWithToken(0)).to.eql([
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000002 movie",
    ]);

    await ourm2.receiveRewardBalanceWithTokens([
      600, 600, 600, 601, 602, 603, 603, 604, 605, 605,
    ]);
    expect(await provider.getBalance(ourm.address)).to.equal(
      // (1233 + 33.9) - (1233 + 33.9) / 3000 * 6
      ethers.utils.parseEther("1264.3662")
    );
    await expect(
      ourm2.receiveRewardBalanceWithTokens([606, 607, 3001])
    ).to.revertedWith("OwnerQueryForNonexistentToken()");
    expect(await provider.getBalance(ourm.address)).to.equal(
      // (1233 + 33.9) - (1233 + 33.9) / 3000 * 6
      ethers.utils.parseEther("1264.3662")
    );
  });

  it("OurMetaverse assetURI", async function () {
    const OurMetaverse = await ethers.getContractFactory("OurMetaverse");
    const ourm = await OurMetaverse.deploy(
      "https://ourmetaverse.github.io/meta.json#"
    );
    await ourm.init();
    expect(await ourm.tokenURI(0)).to.equal(
      "https://ourmetaverse.github.io/meta.json#0"
    );
    await ourm.setBaseURI("ipfs:/xxxxxxx123/");
    expect(await ourm.tokenURI(0)).to.equal("ipfs:/xxxxxxx123/0");
  });
});
