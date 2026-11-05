import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("BotCardRegistry", function () {
  let registry: Contract;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let alice: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let bob: Awaited<ReturnType<typeof ethers.getSigners>>[0];

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BotCardRegistry");
    registry = (await Factory.deploy()) as unknown as Contract;
    await registry.waitForDeployment();
  });

  it("1. Should create a profile and emit ProfileUpdated event", async function () {
    const tx = await registry
      .connect(alice)
      .createProfile(
        "Alice Vance",
        "Protocol Engineer",
        "Building decentralized identity protocols on Botchain.",
        "alice@botcard.eth",
        "https://alice.dev",
        "@alice_web3",
        "Zurich, Switzerland",
        0
      );

    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);

    await expect(tx)
      .to.emit(registry, "ProfileUpdated")
      .withArgs(alice.address, 0);

    expect(await registry.hasProfile(alice.address)).to.equal(true);
    expect(await registry.totalProfiles()).to.equal(1n);
  });

  it("2. Should create a Personal profile (profileType = 0) and store all fields accurately", async function () {
    await registry
      .connect(alice)
      .createProfile(
        "Alice Personal",
        "Smart Contract Auditor",
        "Securing EVM smart contracts and Web3 applications.",
        "alice@security.io",
        "https://audits.alice.io",
        "@alice_sec",
        "Berlin, Germany",
        0
      );

    const profile = await registry.getProfile(alice.address);
    expect(profile.name).to.equal("Alice Personal");
    expect(profile.headline).to.equal("Smart Contract Auditor");
    expect(profile.bio).to.equal("Securing EVM smart contracts and Web3 applications.");
    expect(profile.email).to.equal("alice@security.io");
    expect(profile.website).to.equal("https://audits.alice.io");
    expect(profile.socialHandle).to.equal("@alice_sec");
    expect(profile.location).to.equal("Berlin, Germany");
    expect(profile.profileType).to.equal(0n);
    expect(profile.exists).to.equal(true);
  });

  it("3. Should create a Business profile (profileType = 1) and store all fields accurately", async function () {
    await registry
      .connect(bob)
      .createProfile(
        "Nexus Labs Ltd.",
        "Web3 Infrastructure & RPC Provider",
        "Enterprise-grade node infrastructure and indexing for Botchain ecosystems.",
        "contact@nexuslabs.io",
        "https://nexuslabs.io",
        "@nexuslabs",
        "Singapore",
        1
      );

    const profile = await registry.getProfile(bob.address);
    expect(profile.name).to.equal("Nexus Labs Ltd.");
    expect(profile.headline).to.equal("Web3 Infrastructure & RPC Provider");
    expect(profile.bio).to.equal(
      "Enterprise-grade node infrastructure and indexing for Botchain ecosystems."
    );
    expect(profile.email).to.equal("contact@nexuslabs.io");
    expect(profile.website).to.equal("https://nexuslabs.io");
    expect(profile.socialHandle).to.equal("@nexuslabs");
    expect(profile.location).to.equal("Singapore");
    expect(profile.profileType).to.equal(1n);
    expect(profile.exists).to.equal(true);
  });

  it("4. Should reject duplicate profile creation from the same wallet", async function () {
    await registry
      .connect(alice)
      .createProfile(
        "Alice Vance",
        "Developer",
        "Bio",
        "alice@example.com",
        "https://alice.com",
        "@alice",
        "Remote",
        0
      );

    await expect(
      registry
        .connect(alice)
        .createProfile(
          "Alice Duplicate",
          "Developer",
          "Bio",
          "alice2@example.com",
          "https://alice2.com",
          "@alice2",
          "Remote",
          0
        )
    ).to.be.revertedWithCustomError(registry, "ProfileAlreadyExists");
  });

  it("5. Should update an existing profile and emit ProfileUpdated without incrementing totalProfiles", async function () {
    await registry
      .connect(alice)
      .createProfile(
        "Alice Vance",
        "Junior Dev",
        "Initial bio",
        "alice@old.com",
        "https://old.com",
        "@alice_old",
        "London",
        0
      );

    const updateTx = await registry
      .connect(alice)
      .updateProfile(
        "Alice Vance Studio",
        "Principal Protocol Architect",
        "Updated biography with new achievements.",
        "alice@newstudio.io",
        "https://newstudio.io",
        "@alice_architect",
        "New York, USA",
        1
      );

    await expect(updateTx)
      .to.emit(registry, "ProfileUpdated")
      .withArgs(alice.address, 1);

    const updated = await registry.getProfile(alice.address);
    expect(updated.name).to.equal("Alice Vance Studio");
    expect(updated.headline).to.equal("Principal Protocol Architect");
    expect(updated.bio).to.equal("Updated biography with new achievements.");
    expect(updated.email).to.equal("alice@newstudio.io");
    expect(updated.website).to.equal("https://newstudio.io");
    expect(updated.socialHandle).to.equal("@alice_architect");
    expect(updated.location).to.equal("New York, USA");
    expect(updated.profileType).to.equal(1n);
    expect(updated.exists).to.equal(true);
    expect(await registry.totalProfiles()).to.equal(1n);
  });

  it("6. Should reject unauthorized profile updates (non-owner or wallet without profile)", async function () {
    await registry
      .connect(alice)
      .createProfile(
        "Alice Vance",
        "Engineer",
        "Alice Bio",
        "alice@example.com",
        "https://alice.com",
        "@alice",
        "Paris",
        0
      );

    // Bob attempting to update Alice's profile via updateProfileFor
    await expect(
      registry
        .connect(bob)
        .updateProfileFor(
          alice.address,
          "Hacked Name",
          "Hacked Headline",
          "Hacked Bio",
          "hacker@evil.com",
          "https://evil.com",
          "@hacker",
          "Nowhere",
          0
        )
    ).to.be.revertedWithCustomError(registry, "Unauthorized");

    // Bob attempting to call updateProfile when Bob has no profile
    await expect(
      registry
        .connect(bob)
        .updateProfile(
          "Bob",
          "Headline",
          "Bio",
          "bob@example.com",
          "https://bob.com",
          "@bob",
          "Austin",
          0
        )
    ).to.be.revertedWithCustomError(registry, "ProfileDoesNotExist");

    // Verify Alice's profile remains completely intact
    const aliceProfile = await registry.getProfile(alice.address);
    expect(aliceProfile.name).to.equal("Alice Vance");
  });

  it("7. Should reject invalid profile types (e.g. profileType > 1)", async function () {
    await expect(
      registry
        .connect(alice)
        .createProfile(
          "Alice Vance",
          "Developer",
          "Bio",
          "alice@example.com",
          "https://alice.com",
          "@alice",
          "Remote",
          2
        )
    ).to.be.revertedWithCustomError(registry, "InvalidProfileType");

    await expect(
      registry
        .connect(alice)
        .createProfile(
          "Alice Vance",
          "Developer",
          "Bio",
          "alice@example.com",
          "https://alice.com",
          "@alice",
          "Remote",
          255
        )
    ).to.be.revertedWithCustomError(registry, "InvalidProfileType");
  });

  it("8. Should enforce string length validation across all profile fields", async function () {
    // Empty name should fail
    await expect(
      registry
        .connect(alice)
        .createProfile("", "Headline", "Bio", "a@b.c", "https://a.com", "@a", "Loc", 0)
    ).to.be.revertedWithCustomError(registry, "InvalidNameLength");

    // Name > 80 chars should fail
    await expect(
      registry
        .connect(alice)
        .createProfile(
          "A".repeat(81),
          "Headline",
          "Bio",
          "a@b.c",
          "https://a.com",
          "@a",
          "Loc",
          0
        )
    ).to.be.revertedWithCustomError(registry, "InvalidNameLength");

    // Headline > 120 chars should fail
    await expect(
      registry
        .connect(alice)
        .createProfile(
          "Alice",
          "H".repeat(121),
          "Bio",
          "a@b.c",
          "https://a.com",
          "@a",
          "Loc",
          0
        )
    ).to.be.revertedWithCustomError(registry, "StringTooLong");

    // Bio > 500 chars should fail
    await expect(
      registry
        .connect(alice)
        .createProfile(
          "Alice",
          "Headline",
          "B".repeat(501),
          "a@b.c",
          "https://a.com",
          "@a",
          "Loc",
          0
        )
    ).to.be.revertedWithCustomError(registry, "StringTooLong");

    // Website > 160 chars should fail
    await expect(
      registry
        .connect(alice)
        .createProfile(
          "Alice",
          "Headline",
          "Bio",
          "a@b.c",
          "https://" + "w".repeat(155),
          "@a",
          "Loc",
          0
        )
    ).to.be.revertedWithCustomError(registry, "StringTooLong");
  });

  it("9. Should accurately retrieve registered profiles via getProfile and hasProfile", async function () {
    await registry
      .connect(owner)
      .createProfile(
        "Satoshi Builder",
        "Core Developer",
        "Decentralized systems architect.",
        "satoshi@botchain.dev",
        "https://botchain.dev",
        "@satoshi_bot",
        "Tokyo, Japan",
        0
      );

    expect(await registry.hasProfile(owner.address)).to.equal(true);
    const fetched = await registry.getProfile(owner.address);
    expect(fetched.exists).to.equal(true);
    expect(fetched.name).to.equal("Satoshi Builder");
    expect(fetched.email).to.equal("satoshi@botchain.dev");
  });

  it("10. Should handle nonexistent profile lookup gracefully without reverting", async function () {
    const unknownWallet = bob.address;
    expect(await registry.hasProfile(unknownWallet)).to.equal(false);

    const profile = await registry.getProfile(unknownWallet);
    expect(profile.exists).to.equal(false);
    expect(profile.name).to.equal("");
    expect(profile.headline).to.equal("");
    expect(profile.bio).to.equal("");
    expect(profile.email).to.equal("");
    expect(profile.website).to.equal("");
    expect(profile.socialHandle).to.equal("");
    expect(profile.location).to.equal("");
    expect(profile.profileType).to.equal(0n);
  });

  it("11. Should measure gas costs for deployment, createProfile, and updateProfile", async function () {
    const Factory = await ethers.getContractFactory("BotCardRegistry");
    const deployed = await Factory.deploy();
    const deployReceipt = await deployed.deploymentTransaction()?.wait();
    const deployGas = deployReceipt?.gasUsed ?? 0n;

    const createTx = await registry
      .connect(alice)
      .createProfile(
        "Alice Vance",
        "Full-Stack Web3 Engineer",
        "Building next-generation decentralized contact cards on Botchain.",
        "alice@botcard.io",
        "https://botcard.io",
        "@alice_botcard",
        "San Francisco, CA",
        0
      );
    const createReceipt = await createTx.wait();
    const createGas = createReceipt?.gasUsed ?? 0n;

    const updateTx = await registry
      .connect(alice)
      .updateProfile(
        "Alice Vance",
        "Lead Smart Contract Engineer",
        "Updated bio on Botchain Testnet.",
        "alice@botcard.io",
        "https://botcard.io",
        "@alice_botcard",
        "New York, NY",
        0
      );
    const updateReceipt = await updateTx.wait();
    const updateGas = updateReceipt?.gasUsed ?? 0n;

    console.log(
      `      [Gas Report] Deploy: ${deployGas.toString()} | CreateProfile: ${createGas.toString()} | UpdateProfile: ${updateGas.toString()}`
    );

    expect(deployGas).to.be.greaterThan(0n);
    expect(createGas).to.be.greaterThan(0n);
    expect(updateGas).to.be.greaterThan(0n);
  });
});

