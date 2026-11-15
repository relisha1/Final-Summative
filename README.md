# SkillBridge Certificates

Smart contract for my mission project, SkillBridge, a web platform where young people learn coding with a facilitator. At the end of a course the facilitator checks the student's final project and gives a certificate. This contract puts those certificates on the blockchain so employers can check they are real.

## The problem

Certificates from online courses are easy to fake. A PDF can be edited in minutes, and employers usually can't check with the platform quickly, so they don't trust them. That hurts students who actually did the work.

## How it works

- The platform owner (the account that deploys the contract) adds facilitators.
- A facilitator issues a certificate after validating the project. It stores the student's wallet, name, course, the SHA-256 hash of the project, who issued it and when.
- Anyone (e.g. an employer) can check a certificate for free with `verifyCertificate(id)` or `verifyByHash(hash)`.
- The facilitator who issued a certificate, or the owner, can revoke it.

Checks in the contract: only facilitators can issue, the same project can't be certified twice, a facilitator can't certify themselves, empty details are rejected, and only the issuer or owner can revoke.

## Deployed contract (Sepolia)

`0xD6436cF6805E6160fDb2a4bCd4Ba74ac4819421f`

https://sepolia.etherscan.io/address/0xD6436cF6805E6160fDb2a4bCd4Ba74ac4819421f

## Run it

Needs Node.js.

```
npm install
npx hardhat test
npx hardhat run scripts/deploy.js
```

To get the hash of a project file:

```
npm run hash -- sample-project/todo-app.html
```

## Files

- `contracts/SkillBridgeCertificates.sol` - the contract
- `test/SkillBridgeCertificates.test.js` - 14 tests
- `scripts/deploy.js` - deploys and issues one test certificate on the local network
- `scripts/hash-project.js` - prints the SHA-256 hash of a file
- `sample-project/todo-app.html` - example student project used for testing

## Deploying with Remix

1. Paste the contract into Remix and compile with 0.8.24.
2. Deploy with Browser Extension (MetaMask) on Sepolia.
3. From the owner account call `addFacilitator`.
4. Switch to the facilitator account and call `issueCertificate`.
5. Use `verifyCertificate`, `getCertificate` and `verifyByHash` to check it.
