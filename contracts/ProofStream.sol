// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ProofStream
/// @notice Native MON escrow, time-based tutoring settlement, and lightweight skill attestations.
contract ProofStream is ReentrancyGuard {
    uint256 public constant ATTESTATION_TIMEOUT = 5 minutes;

    enum Status {
        Open,
        Funded,
        Active,
        Ended
    }

    struct Session {
        address payable tutor;
        address payable student;
        string title;
        uint256 pricePerMinute;
        uint256 depositedAmount;
        uint256 startedAt;
        uint256 endedAt;
        uint256 earnedAmount;
        uint256 refundedAmount;
        bool studentAttested;
        bool tutorAttested;
        bool proofIssued;
        Status status;
    }

    uint256 public nextSessionId;
    mapping(uint256 => Session) public sessions;
    mapping(address => uint256) public tutorReputation;

    event SessionCreated(
        uint256 indexed sessionId,
        address indexed tutor,
        string title,
        uint256 pricePerMinute
    );
    event Deposited(uint256 indexed sessionId, address indexed student, uint256 amount, uint256 totalDeposit);
    event SessionStarted(uint256 indexed sessionId, uint256 startedAt);
    event SessionEnded(
        uint256 indexed sessionId,
        uint256 endedAt,
        uint256 earnedAmount,
        uint256 refundedAmount
    );
    event SessionAttested(uint256 indexed sessionId, address indexed participant);
    event SkillProofMinted(
        address indexed student,
        address indexed tutor,
        uint256 indexed sessionId,
        string subject,
        uint256 duration
    );

    error SessionNotFound();
    error EmptyTitle();
    error InvalidPrice();
    error InvalidDeposit();
    error InvalidStatus();
    error TutorCannotFundOwnSession();
    error NotSessionStudent();
    error NotParticipant();
    error AlreadyAttested();
    error ProofAlreadyIssued();
    error TransferFailed();

    function createSession(string memory title, uint256 pricePerMinute) external returns (uint256 sessionId) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (pricePerMinute == 0) revert InvalidPrice();

        sessionId = nextSessionId++;
        Session storage session = sessions[sessionId];
        session.tutor = payable(msg.sender);
        session.title = title;
        session.pricePerMinute = pricePerMinute;

        emit SessionCreated(sessionId, msg.sender, title, pricePerMinute);
    }

    function deposit(uint256 sessionId) external payable {
        Session storage session = _getSession(sessionId);
        if (session.status != Status.Open && session.status != Status.Funded) revert InvalidStatus();
        if (msg.value == 0) revert InvalidDeposit();
        if (msg.sender == session.tutor) revert TutorCannotFundOwnSession();

        if (session.student == address(0)) {
            session.student = payable(msg.sender);
        } else if (msg.sender != session.student) {
            revert NotSessionStudent();
        }

        session.depositedAmount += msg.value;
        session.status = Status.Funded;
        emit Deposited(sessionId, msg.sender, msg.value, session.depositedAmount);
    }

    function startSession(uint256 sessionId) external {
        Session storage session = _getSession(sessionId);
        if (session.status != Status.Funded) revert InvalidStatus();
        if (msg.sender != session.student) revert NotSessionStudent();

        session.startedAt = block.timestamp;
        session.status = Status.Active;
        emit SessionStarted(sessionId, block.timestamp);
    }

    function endSession(uint256 sessionId) external nonReentrant {
        Session storage session = _getSession(sessionId);
        if (session.status != Status.Active) revert InvalidStatus();
        if (msg.sender != session.student && msg.sender != session.tutor) revert NotParticipant();

        uint256 earned = ((block.timestamp - session.startedAt) * session.pricePerMinute) / 60;
        if (earned > session.depositedAmount) earned = session.depositedAmount;
        uint256 refund = session.depositedAmount - earned;

        session.endedAt = block.timestamp;
        session.earnedAmount = earned;
        session.refundedAmount = refund;
        session.status = Status.Ended;

        if (earned != 0) {
            (bool tutorPaid, ) = session.tutor.call{value: earned}("");
            if (!tutorPaid) revert TransferFailed();
        }
        if (refund != 0) {
            (bool studentRefunded, ) = session.student.call{value: refund}("");
            if (!studentRefunded) revert TransferFailed();
        }

        emit SessionEnded(sessionId, block.timestamp, earned, refund);
    }

    /// @notice Records a participant's attestation. A previously attested participant may call again
    /// after the timeout to finalize a one-sided proof.
    function attestSession(uint256 sessionId) external {
        Session storage session = _getSession(sessionId);
        if (session.status != Status.Ended) revert InvalidStatus();
        if (session.proofIssued) revert ProofAlreadyIssued();

        bool newAttestation;
        if (msg.sender == session.student) {
            if (!session.studentAttested) {
                session.studentAttested = true;
                newAttestation = true;
            }
        } else if (msg.sender == session.tutor) {
            if (!session.tutorAttested) {
                session.tutorAttested = true;
                newAttestation = true;
            }
        } else {
            revert NotParticipant();
        }

        bool timedOut = block.timestamp >= session.endedAt + ATTESTATION_TIMEOUT;
        if (!newAttestation && !timedOut) revert AlreadyAttested();
        if (newAttestation) emit SessionAttested(sessionId, msg.sender);

        if ((session.studentAttested && session.tutorAttested) || timedOut) {
            _issueProof(sessionId, session);
        }
    }

    function getSession(uint256 sessionId) external view returns (Session memory) {
        return _getSession(sessionId);
    }

    function previewSettlement(uint256 sessionId) external view returns (uint256 earned, uint256 refund) {
        Session storage session = _getSession(sessionId);
        if (session.status == Status.Ended) return (session.earnedAmount, session.refundedAmount);
        if (session.status != Status.Active) return (0, session.depositedAmount);

        earned = ((block.timestamp - session.startedAt) * session.pricePerMinute) / 60;
        if (earned > session.depositedAmount) earned = session.depositedAmount;
        refund = session.depositedAmount - earned;
    }

    function _issueProof(uint256 sessionId, Session storage session) internal {
        session.proofIssued = true;
        tutorReputation[session.tutor] += 1;
        emit SkillProofMinted(
            session.student,
            session.tutor,
            sessionId,
            session.title,
            session.endedAt - session.startedAt
        );
    }

    function _getSession(uint256 sessionId) internal view returns (Session storage session) {
        if (sessionId >= nextSessionId) revert SessionNotFound();
        session = sessions[sessionId];
    }
}
