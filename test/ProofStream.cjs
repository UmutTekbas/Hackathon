const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ProofStream", function () {
  async function deployFixture() {
    const [tutor, student, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ProofStream");
    const contract = await Factory.deploy();
    return { contract, tutor, student, stranger };
  }

  async function endedSession() {
    const fixture = await deployFixture();
    const { contract, tutor, student } = fixture;
    await contract.connect(tutor).createSession("Calculus · Derivatives", ethers.parseEther("0.5"));
    await contract.connect(student).deposit(0, { value: ethers.parseEther("2") });
    await contract.connect(student).startSession(0);
    const started = (await contract.getSession(0)).startedAt;
    await time.setNextBlockTimestamp(started + 90n);
    await contract.connect(student).endSession(0);
    return { ...fixture, started };
  }

  it("settles elapsed time pro-rata and refunds the unused escrow", async function () {
    const { contract } = await endedSession();
    const session = await contract.getSession(0);

    expect(session.status).to.equal(3);
    expect(session.earnedAmount).to.equal(ethers.parseEther("0.75"));
    expect(session.refundedAmount).to.equal(ethers.parseEther("1.25"));
    expect(await ethers.provider.getBalance(contract.target)).to.equal(0);
  });

  it("issues one proof and increases reputation after both participants attest", async function () {
    const { contract, tutor, student } = await endedSession();

    await expect(contract.connect(student).attestSession(0))
      .to.emit(contract, "SessionAttested")
      .withArgs(0, student.address);

    await expect(contract.connect(tutor).attestSession(0))
      .to.emit(contract, "SkillProofMinted")
      .withArgs(student.address, tutor.address, 0, "Calculus · Derivatives", 90);

    expect(await contract.tutorReputation(tutor.address)).to.equal(1);
    expect((await contract.getSession(0)).proofIssued).to.equal(true);
    await expect(contract.connect(student).attestSession(0)).to.be.revertedWithCustomError(
      contract,
      "ProofAlreadyIssued"
    );
  });

  it("allows a one-sided proof to be finalized after the timeout", async function () {
    const { contract, tutor, student } = await endedSession();
    await contract.connect(student).attestSession(0);
    const session = await contract.getSession(0);
    const timeout = await contract.ATTESTATION_TIMEOUT();
    await time.setNextBlockTimestamp(session.endedAt + timeout);

    await expect(contract.connect(student).attestSession(0))
      .to.emit(contract, "SkillProofMinted")
      .withArgs(student.address, tutor.address, 0, "Calculus · Derivatives", 90);
    expect(await contract.tutorReputation(tutor.address)).to.equal(1);
  });

  it("rejects unauthorized lifecycle actions", async function () {
    const { contract, tutor, student, stranger } = await deployFixture();
    await contract.connect(tutor).createSession("Physics", ethers.parseEther("0.1"));
    await contract.connect(student).deposit(0, { value: ethers.parseEther("1") });

    await expect(contract.connect(stranger).startSession(0)).to.be.revertedWithCustomError(
      contract,
      "NotSessionStudent"
    );
    await contract.connect(student).startSession(0);
    await expect(contract.connect(stranger).endSession(0)).to.be.revertedWithCustomError(
      contract,
      "NotParticipant"
    );
  });
});
