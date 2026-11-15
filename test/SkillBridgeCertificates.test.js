const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillBridgeCertificates", function () {
  let contract, owner, facilitator, student, employer, other;

  const projectHash = ethers.sha256(ethers.toUtf8Bytes("todo-app-project.zip"));
  const otherHash = ethers.sha256(ethers.toUtf8Bytes("portfolio-website.zip"));

  beforeEach(async function () {
    [owner, facilitator, student, employer, other] = await ethers.getSigners();

    const Certificates = await ethers.getContractFactory("SkillBridgeCertificates");
    contract = await Certificates.deploy();

    await contract.addFacilitator(facilitator.address);
  });

  async function issueOne() {
    await contract
      .connect(facilitator)
      .issueCertificate(student.address, "Alice Uwase", "Intro to JavaScript", projectHash);
  }

  it("1. sets the deployer as the platform owner", async function () {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("2. owner can add a facilitator", async function () {
    await expect(contract.addFacilitator(other.address))
      .to.emit(contract, "FacilitatorAdded")
      .withArgs(other.address);
    expect(await contract.isFacilitator(other.address)).to.equal(true);
  });

  it("3. non-owner cannot add a facilitator", async function () {
    await expect(
      contract.connect(other).addFacilitator(other.address)
    ).to.be.revertedWith("Only the platform owner can do this");
  });

  it("4. facilitator can issue a certificate", async function () {
    await expect(
      contract
        .connect(facilitator)
        .issueCertificate(student.address, "Alice Uwase", "Intro to JavaScript", projectHash)
    )
      .to.emit(contract, "CertificateIssued")
      .withArgs(1, student.address, facilitator.address, "Intro to JavaScript");

    const cert = await contract.getCertificate(1);
    expect(cert.student).to.equal(student.address);
    expect(cert.studentName).to.equal("Alice Uwase");
    expect(cert.courseName).to.equal("Intro to JavaScript");
    expect(cert.projectHash).to.equal(projectHash);
    expect(cert.issuedBy).to.equal(facilitator.address);
    expect(cert.revoked).to.equal(false);
    expect(await contract.totalCertificates()).to.equal(1);
  });

  it("5. someone who is not a facilitator cannot issue", async function () {
    await expect(
      contract
        .connect(other)
        .issueCertificate(student.address, "Alice Uwase", "Intro to JavaScript", projectHash)
    ).to.be.revertedWith("Only a facilitator can do this");
  });

  it("6. the same project cannot be certified twice", async function () {
    await issueOne();
    await expect(
      contract
        .connect(facilitator)
        .issueCertificate(other.address, "Bob Mugisha", "Intro to JavaScript", projectHash)
    ).to.be.revertedWith("This project already has a certificate");
  });

  it("7. rejects empty or invalid details", async function () {
    const f = contract.connect(facilitator);
    await expect(
      f.issueCertificate(ethers.ZeroAddress, "Alice", "JS", projectHash)
    ).to.be.revertedWith("Invalid student address");
    await expect(
      f.issueCertificate(student.address, "", "JS", projectHash)
    ).to.be.revertedWith("Student name is required");
    await expect(
      f.issueCertificate(student.address, "Alice", "", projectHash)
    ).to.be.revertedWith("Course name is required");
    await expect(
      f.issueCertificate(student.address, "Alice", "JS", ethers.ZeroHash)
    ).to.be.revertedWith("Project hash is required");
  });

  it("8. facilitator cannot certify themselves", async function () {
    await expect(
      contract
        .connect(facilitator)
        .issueCertificate(facilitator.address, "Me", "Intro to JavaScript", projectHash)
    ).to.be.revertedWith("You cannot certify yourself");
  });

  it("9. employer can verify a valid certificate by ID and by hash", async function () {
    await issueOne();

    const [valid, message] = await contract.connect(employer).verifyCertificate(1);
    expect(valid).to.equal(true);
    expect(message).to.equal("Certificate is valid");

    const [hashValid, id] = await contract.connect(employer).verifyByHash(projectHash);
    expect(hashValid).to.equal(true);
    expect(id).to.equal(1);
  });

  it("10. verifying a fake certificate returns false", async function () {
    const [valid, message] = await contract.verifyCertificate(99);
    expect(valid).to.equal(false);
    expect(message).to.equal("Certificate not found");

    const [hashValid, id] = await contract.verifyByHash(otherHash);
    expect(hashValid).to.equal(false);
    expect(id).to.equal(0);
  });

  it("11. issuer can revoke and verification then fails", async function () {
    await issueOne();

    await expect(contract.connect(facilitator).revokeCertificate(1, "Plagiarism found"))
      .to.emit(contract, "CertificateRevoked")
      .withArgs(1, facilitator.address, "Plagiarism found");

    const [valid, message] = await contract.verifyCertificate(1);
    expect(valid).to.equal(false);
    expect(message).to.equal("Certificate has been revoked");

    await expect(
      contract.connect(facilitator).revokeCertificate(1, "again")
    ).to.be.revertedWith("Already revoked");
  });

  it("12. a random account cannot revoke a certificate", async function () {
    await issueOne();
    await expect(
      contract.connect(employer).revokeCertificate(1, "I don't like it")
    ).to.be.revertedWith("Not allowed to revoke");
  });

  it("13. removed facilitator cannot issue, but old certificates stay valid", async function () {
    await issueOne();
    await contract.removeFacilitator(facilitator.address);

    await expect(
      contract
        .connect(facilitator)
        .issueCertificate(other.address, "Bob Mugisha", "Python Basics", otherHash)
    ).to.be.revertedWith("Only a facilitator can do this");

    const [valid] = await contract.verifyCertificate(1);
    expect(valid).to.equal(true);
  });

  it("14. lists all certificates of a student", async function () {
    await issueOne();
    await contract
      .connect(facilitator)
      .issueCertificate(student.address, "Alice Uwase", "Python Basics", otherHash);

    const ids = await contract.getStudentCertificates(student.address);
    expect(ids.map(Number)).to.deep.equal([1, 2]);
  });
});
