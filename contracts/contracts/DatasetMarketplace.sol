// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// Import the Types library for managing ciphertexts
import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {BLS} from "blocklock-solidity/src/libraries/BLS.sol";
// Import the AbstractBlocklockReceiver for handling timelock decryption callbacks
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

contract DatasetMarketplace is ReentrancyGuard, AbstractBlocklockReceiver {
    enum DatasetCategory {
        Finance,
        Medicine,
        Text
    }

    struct Dataset {
        address owner;
        string cid;
        uint256 price;
        uint256 starsTotal;
        uint256 starsCount;
        uint256 downloads;
        uint256 createdAt;
        DatasetCategory category;
        string title;
        string preview;
        string id;
        uint256 decryptionBlockNumber;
        bool isEncrypted;
        TypesLib.Ciphertext ciphertext;
    }

    // datasetsArray
    Dataset[] public datasetsArray;

    // datasetid => Dataset
    mapping(string => Dataset) public datasets;

    // datasetId => buyer => hasAccess
    mapping(string => mapping(address => bool)) public hasAccess;

    // requestId => datasetId
    mapping(uint256 => string) public requestIdToDatasetId;

    // datasetId => user => hasRated
    mapping(string => mapping(address => bool)) public hasRated;

    // datasetId => reviewId => review text
    mapping(string => mapping(uint256 => string)) public reviews;

    event DatasetCreated(
        string indexed id,
        address indexed owner,
        string cid,
        uint256 createdAt,
        uint256 price
    );
    event DatasetUpdated(string indexed id, string newCid, uint256 newPrice);
    event DatasetPurchased(string indexed id, address indexed buyer);
    event DatasetRated(string indexed id, address indexed rater, uint8 stars);
    event DatasetDownloaded(string indexed id, address indexed user);

    error DatasetMarketplace__NotDatasetOwner();
    error DatasetMarketplace__InsufficientPayment();
    error DatasetMarketplace__AccessDenied();
    error DatasetMarketplace__DatasetNotFound();
    error DatasetMarketplace__InvalidDatasetId();
    error DatasetMarketplace__AlreadyHasAccess();
    error DatasetMarketplace__AlreadyRated();
    error DatasetMarketplace__InvalidStarValue();
    error DatasetMarketplace__PaymentFailed();
    error DatasetMarketplace__InvalidSignature();
    error DatasetMarketplace__DatasetNotEncrypted();
    error DatasetMarketplace__BlockNumberAlreadyPass();

    address public constant backendSigAddress =
        address(0x38dAFB5A3f0aBE1F4e3F45162B480142Aae29d38);

    constructor(
        address blocklockContract
    ) AbstractBlocklockReceiver(blocklockContract) {}

    function uploadEncryptedDataset(
        string calldata datasetId,
        uint256 price,
        DatasetCategory category,
        string calldata preview,
        string calldata title,
        bytes memory signature,
        uint256 decryptionBlockNumber,
        TypesLib.Ciphertext calldata ciphertext
    ) external {
        if (block.number > decryptionBlockNumber) {
            revert DatasetMarketplace__BlockNumberAlreadyPass();
        }

        Dataset memory dataset = Dataset({
            owner: msg.sender,
            cid: "",
            price: price,
            starsTotal: 0,
            starsCount: 0,
            downloads: 0,
            createdAt: block.timestamp,
            category: category,
            title: title,
            preview: preview,
            id: datasetId,
            isEncrypted: true,
            ciphertext: ciphertext,
            decryptionBlockNumber: decryptionBlockNumber
        });

        datasetsArray.push(dataset);
        datasets[datasetId] = dataset;

        // Store the requestId to datasetId mapping
        uint256 requestId = blocklock.requestBlocklock(
            decryptionBlockNumber,
            ciphertext
        );
        requestIdToDatasetId[requestId] = datasetId;

        bytes32 messageHash = keccak256(abi.encodePacked(datasetId));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );
        if (
            ECDSA.recover(ethSignedMessageHash, signature) != backendSigAddress
        ) {
            revert DatasetMarketplace__InvalidSignature();
        }

        emit DatasetCreated(datasetId, msg.sender, "", block.timestamp, price);
    }

    function receiveBlocklock(
        uint256 requestID,
        bytes calldata decryptionKey
    ) external override onlyBlocklockContract {
        string memory datasetId = requestIdToDatasetId[requestID];
        if (!datasets[datasetId].isEncrypted) {
            revert DatasetMarketplace__DatasetNotEncrypted();
        }
        // get encrypted value
        TypesLib.Ciphertext memory encryptedValue = datasets[datasetId]
            .ciphertext;
        string memory cid = abi.decode(
            blocklock.decrypt(encryptedValue, decryptionKey),
            (string)
        );
        // Update the dataset with the decrypted CID
        datasets[datasetId].cid = cid;
        datasets[datasetId].isEncrypted = false;
        datasets[datasetId].decryptionBlockNumber = 0;
        // loop through the datasetsArray to find the dataset
        for (uint256 i = 0; i < datasetsArray.length; i++) {
            if (
                keccak256(abi.encodePacked(datasetsArray[i].id)) ==
                keccak256(abi.encodePacked(datasetId))
            ) {
                datasetsArray[i].cid = cid;
                datasetsArray[i].isEncrypted = false;
                datasetsArray[i].decryptionBlockNumber = 0;
                break;
            }
        }
    }

    function uploadDataset(
        string calldata datasetId,
        string calldata cid,
        uint256 price,
        DatasetCategory category,
        string calldata preview,
        string calldata title,
        bytes memory signature
    ) external {
        Dataset memory dataset = Dataset({
            owner: msg.sender,
            cid: cid,
            price: price,
            starsTotal: 0,
            starsCount: 0,
            createdAt: block.timestamp,
            downloads: 0,
            category: category,
            title: title,
            preview: preview,
            id: datasetId,
            isEncrypted: false,
            ciphertext: TypesLib.Ciphertext({
                u: BLS.PointG2({
                    x: [uint256(0), uint256(0)],
                    y: [uint256(0), uint256(0)]
                }),
                v: "",
                w: ""
            }),
            decryptionBlockNumber: 0
        });
        datasetsArray.push(dataset);
        datasets[datasetId] = dataset;

        bytes32 messageHash = keccak256(abi.encodePacked(datasetId, cid));

        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            messageHash
        );

        if (
            ECDSA.recover(ethSignedMessageHash, signature) != backendSigAddress
        ) {
            revert DatasetMarketplace__InvalidSignature();
        }

        emit DatasetCreated(datasetId, msg.sender, cid, block.timestamp, price);
    }

    function updateDataset(
        string calldata datasetId,
        string calldata newCid,
        uint256 newPrice
    ) external {
        Dataset storage dataset = datasets[datasetId];
        if (dataset.owner != msg.sender)
            revert DatasetMarketplace__NotDatasetOwner();
        if (newPrice == 0) revert DatasetMarketplace__InsufficientPayment();
        if (bytes(newCid).length == 0)
            revert DatasetMarketplace__AccessDenied();

        dataset.cid = newCid;
        dataset.price = newPrice;

        emit DatasetUpdated(datasetId, newCid, newPrice);
    }

    function purchaseAccess(
        string calldata datasetId
    ) external payable nonReentrant {
        Dataset memory dataset = datasets[datasetId];
        if (msg.value < dataset.price)
            revert DatasetMarketplace__InsufficientPayment();
        if (hasAccess[datasetId][msg.sender])
            revert DatasetMarketplace__AlreadyHasAccess();

        hasAccess[datasetId][msg.sender] = true;

        (bool success, ) = dataset.owner.call{value: msg.value}("");

        if (!success) {
            revert DatasetMarketplace__PaymentFailed();
        }

        emit DatasetPurchased(datasetId, msg.sender);
    }

    function canAccess(
        string calldata datasetId,
        address user
    ) external view returns (bool) {
        return hasAccess[datasetId][user];
    }

    function getAllDatasets()
        external
        view
        returns (Dataset[] memory allDatasets)
    {
        return datasetsArray;
    }

    function getDataset(
        string calldata datasetId
    )
        external
        view
        returns (
            string memory cid,
            uint256 price,
            address owner,
            uint256 stars,
            uint256 count,
            uint256 downloads
        )
    {
        Dataset memory dataset = datasets[datasetId];
        return (
            dataset.cid,
            dataset.price,
            dataset.owner,
            dataset.starsTotal,
            dataset.starsCount,
            dataset.downloads
        );
    }

    /// ⭐ Users can rate a dataset (once)
    function rateDataset(string calldata datasetId, uint8 stars) external {
        if (stars < 1 || stars > 5)
            revert DatasetMarketplace__InvalidStarValue();
        if (hasRated[datasetId][msg.sender])
            revert DatasetMarketplace__AlreadyRated();

        Dataset storage dataset = datasets[datasetId];
        dataset.starsTotal += stars;
        dataset.starsCount += 1;
        hasRated[datasetId][msg.sender] = true;

        emit DatasetRated(datasetId, msg.sender, stars);
    }

    /// ⬇️ Increase download count
    function recordDownload(string calldata datasetId) external {
        if (!hasAccess[datasetId][msg.sender])
            revert DatasetMarketplace__AccessDenied();

        Dataset storage dataset = datasets[datasetId];
        dataset.downloads += 1;

        emit DatasetDownloaded(datasetId, msg.sender);
    }
}
