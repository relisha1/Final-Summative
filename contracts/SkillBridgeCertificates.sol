// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SkillBridgeCertificates {
    struct Certificate {
        uint256 id;
        address student;
        string studentName;
        string courseName;
        bytes32 projectHash;   // SHA-256 of the student project
        address issuedBy;
        uint256 issuedAt;
        bool revoked;
    }

    address public owner;
    uint256 public totalCertificates;

    mapping(address => bool) public isFacilitator;
    mapping(uint256 => Certificate) private certificates;
    mapping(bytes32 => uint256) private certificateByHash; // 0 means no certificate
    mapping(address => uint256[]) private studentCertificates;

    event FacilitatorAdded(address indexed facilitator);
    event FacilitatorRemoved(address indexed facilitator);
    event CertificateIssued(
        uint256 indexed id,
        address indexed student,
        address indexed issuedBy,
        string courseName
    );
    event CertificateRevoked(uint256 indexed id, address indexed revokedBy, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the platform owner can do this");
        _;
    }

    modifier onlyFacilitator() {
        require(isFacilitator[msg.sender], "Only a facilitator can do this");
        _;
    }

    modifier certificateExists(uint256 id) {
        require(id > 0 && id <= totalCertificates, "Certificate does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // owner functions

    function addFacilitator(address facilitator) external onlyOwner {
        require(facilitator != address(0), "Invalid address");
        require(!isFacilitator[facilitator], "Already a facilitator");

        isFacilitator[facilitator] = true;
        emit FacilitatorAdded(facilitator);
    }

    function removeFacilitator(address facilitator) external onlyOwner {
        require(isFacilitator[facilitator], "Not a facilitator");

        isFacilitator[facilitator] = false;
        emit FacilitatorRemoved(facilitator);
    }

    // facilitator functions

    function issueCertificate(
        address student,
        string calldata studentName,
        string calldata courseName,
        bytes32 projectHash
    ) external onlyFacilitator returns (uint256) {
        require(student != address(0), "Invalid student address");
        require(student != msg.sender, "You cannot certify yourself");
        require(bytes(studentName).length > 0, "Student name is required");
        require(bytes(courseName).length > 0, "Course name is required");
        require(projectHash != bytes32(0), "Project hash is required");
        // one certificate per project
        require(certificateByHash[projectHash] == 0, "This project already has a certificate");

        totalCertificates++;
        uint256 id = totalCertificates;

        certificates[id] = Certificate(
            id,
            student,
            studentName,
            courseName,
            projectHash,
            msg.sender,
            block.timestamp,
            false
        );
        certificateByHash[projectHash] = id;
        studentCertificates[student].push(id);

        emit CertificateIssued(id, student, msg.sender, courseName);
        return id;
    }

    function revokeCertificate(uint256 id, string calldata reason) external certificateExists(id) {
        Certificate storage cert = certificates[id];
        // only the facilitator who issued it or the owner
        require(msg.sender == cert.issuedBy || msg.sender == owner, "Not allowed to revoke");
        require(!cert.revoked, "Already revoked");

        cert.revoked = true;
        emit CertificateRevoked(id, msg.sender, reason);
    }

    // anyone can call these for free

    function verifyCertificate(uint256 id) external view returns (bool, string memory) {
        if (id == 0 || id > totalCertificates) {
            return (false, "Certificate not found");
        }
        if (certificates[id].revoked) {
            return (false, "Certificate has been revoked");
        }
        return (true, "Certificate is valid");
    }

    function verifyByHash(bytes32 projectHash) external view returns (bool valid, uint256 id) {
        id = certificateByHash[projectHash];
        valid = id != 0 && !certificates[id].revoked;
    }

    function getCertificate(uint256 id) external view certificateExists(id) returns (Certificate memory) {
        return certificates[id];
    }

    function getStudentCertificates(address student) external view returns (uint256[] memory) {
        return studentCertificates[student];
    }
}
