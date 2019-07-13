pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../client/node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title A digital time capsule for images
* @author John Park
* @notice This smart contract's main purpose is to store the state for an image time capsule application. Along with basic inifo like unlock time, title, etc, private key used to encrypt the AES key and the encrypted AES key is stored for each entry
*/
contract TimeCapsule {
  using SafeMath for uint256;

  /// Custom type: Stores data about each encrypted image in IPFS
  struct Entry {
    uint256 id;
    uint256 unlockTime;
    address owner;
    string ipfs;
    string title;
    string ec_aes_key;
    string priv_key;
    bool isReleased;
  }

  /// State variables: 
  mapping (uint256 => Entry) private entries; 
  mapping(address => Entry[]) private ownerToEntries;
  
  bool public contractPaused = false;
  address payable public contractOwner;
  uint256 public counter;

  /// Events
  event EventEntry(
    uint256 id,
    string title,
    string ipfs,
    bool isReleased,
    uint256 unlockTime
  );

  event EventRelease(
    uint256 id,
    address owner,
    string priv_key,
    string ec_aes_key,
    string ipfs,
    bool isReleased
  );

  /// Modifiers
  modifier onlyContractOwner() { /// only the contract creator can call
    require(msg.sender == contractOwner);
    _;
  }

  modifier onlyOwner(uint256 _id) { /// only the creator of the entry/entries can call
    require(msg.sender == entries[_id].owner);
    _;
  }

  modifier checkIfPaused() { /// If the contract is paused, stop the modified function. Attach this modifier to all public functions
    require(contractPaused == false);
    _;
  }

  /**
   * @dev In order to avoid any complications that might arise from the fact that mining takes 10 to 20 seconds (such as frontrunning), the modifier has a wiggle room of 5 minutes. It's an extra precaution that might not be needed since you can only specify up to the day in the application UI
   */
  modifier checkRelease(uint256 _id) {
    /// Note if the scale of your time-dependent event can vary by 15 seconds and maintain integrity, it is safe to use a block.timestamp / now
    require(now >= (entries[_id].unlockTime.sub(300)));
    _;
  }

  constructor() public {
    contractOwner = msg.sender;
    counter = 0;
  }

   /**
   * @author John Park
   * @notice Stores key pieces of information for an encrypted image
   * @param _unlockTime The time when an encrypted image is able to be decrypted (Unix timestamp in seconds)
   * @param _ipfs IPFS hash of the encrypted image
   * @param _title Title of the encrypted image
   * @param _ecAesKey Encrypted AES key -> AES key is used to encrypt the image. Public RSA key is used to encyrpt the AES key. Private RSA key is used to decrpt the encrypted AES key
   * @param _privKey Private RSA key -> AES key is used to encrypt the image. Public RSA key is used to encyrpt the AES key. Private RSA key is used to decrpt the encrypted AES key
   */
  function appendEntry(uint256 _unlockTime, string memory _ipfs, string memory _title, string memory _ecAesKey, string memory _privKey) public checkIfPaused {
    /// Increment id counter for new entry
    counter = counter.add(1);

    /// Defining Entry Struct instance
    Entry memory entry = Entry(
      counter,
      _unlockTime,
      msg.sender,
      _ipfs,
      _title,
      _ecAesKey,
      _privKey,
      false
    );

    entries[counter] = entry;
    ownerToEntries[msg.sender].push(entry);

    /// Trigger an event to communicate with the client that the entry has successfully been added to the blockchain
    emit EventEntry(counter, _title, _ipfs, false, _unlockTime);
  }

  /**
   * @author John Park
   * @notice Checks if it's time to decrypt an image by marking a boolean 
   * @param _id The Entry id. Used to identify which image is to be marked as ready to be decrypted
   */
  function release(uint256 _id) public checkRelease(_id) onlyOwner(_id) checkIfPaused {
    Entry storage entry = entries[_id];
    /// Change isReleased value
    entry.isReleased = true;

    Entry[] storage senderEntries = ownerToEntries[msg.sender];

    for (uint i=0; i<senderEntries.length; i++) {
      if (senderEntries[i].id == _id) {
        senderEntries[i].isReleased = true;
      }  
    }

    /// Trigger an event to communicate with the client that the entry has been successfully designated as released
    emit EventRelease(_id, entry.owner, entry.priv_key, entry.ec_aes_key, entry.ipfs, true);
  }

  /**
   * @author John Park
   * @notice Fetches an Entry using _id as the unique identifier
   * @param _id The Entry id
   * @return An Entry struct
   */
  function getEntry(uint256 _id) public view onlyOwner(_id) checkIfPaused returns(Entry memory) {
    return entries[_id];
  }

  /**
   * @author John Park
   * @notice Fetches an array of all of the message sender's Entries
   * @return An array of Entries
   */
  function getSenderEntries() public view checkIfPaused returns(Entry[] memory) {
    return ownerToEntries[msg.sender];
  }

  /**
   * @author John Park
   * @notice Fetches the total number of Entries stored in the contract
   * @return Total number of Entries in the contract
   */
  function getTotalEntries() public view checkIfPaused returns(uint256 x) {
    return counter;
  }

  /**
   * @author John Park
   * @notice Flips the value of contractPaused state variable so that the circuit breaker modifier kicks in
   */
  function circuitBreaker() public onlyContractOwner {
      if (contractPaused == false) { contractPaused = true; }
      else { contractPaused = false; }
  }

  /**
   * @author John Park
   * @notice Kill the contract so that it's no longer accessible 
   */
  function close() public onlyContractOwner {
    selfdestruct(contractOwner);
  }
}