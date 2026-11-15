const { ethers } = require("hardhat");

async function main() {
  const [owner, facilitator, student] = await ethers.getSigners();

  const Certificates = await ethers.getContractFactory("SkillBridgeCertificates");
  const contract = await Certificates.deploy();
  await contract.waitForDeployment();
  console.log("SkillBridgeCertificates deployed to:", await contract.getAddress());
  console.log("Owner:", owner.address);

  await contract.addFacilitator(facilitator.address);
  console.log("Facilitator added:", facilitator.address);

  const projectHash = ethers.sha256(ethers.toUtf8Bytes("todo-app-project.zip"));
  await contract
    .connect(facilitator)
    .issueCertificate(student.address, "Alice Uwase", "Intro to JavaScript", projectHash);
  console.log("Certificate 1 issued to:", student.address);

  const [valid, message] = await contract.verifyCertificate(1);
  console.log("Verify certificate 1:", valid, "-", message);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
