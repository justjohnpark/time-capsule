var TimeCapsule = artifacts.require('TimeCapsule');
let catchRevert = require("./exceptionsHelpers.js").catchRevert;
let catchCallingKilledContract = require("./exceptionsHelpers.js").catchCallingKilledContract;
const BN = web3.utils.BN;

contract('TimeCapsule', function(accounts) {
	const firstAccount = accounts[0];
  const secondAccount = accounts[1];

  let instance;

  beforeEach(async () => {
    instance = await TimeCapsule.new();
  });

  describe("Setup", async() => {
    it("OWNER should be set to the deploying address", async() => {
      const owner = await instance.contractOwner();
      assert.equal(owner, firstAccount, "the deploying address should be the owner");
    });

    it("the circuit breaker state variable contractPaused should be set to false initially", async() => {
    	const contractPaused = await instance.contractPaused();
    	assert.equal(contractPaused, false, "the contractPaused state variable should be the false");
    });
  });

  describe("Functions", () => {
  	describe("appendEntry()", async () => {
	  	it("should emit a EventEntry event when an entry is added and create an Entry w/ the correct data", async()=> {
	  	    let eventEmitted = false

	  	    const tx = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount});
	  	    
	  	    if (tx.logs[0].event == "EventEntry") {
	  	        eventEmitted = true;
	  	    }

	  	    assert.equal(eventEmitted, true, 'adding an entry should emit a EventEntry event');

	  	    const result = await instance.getEntry(1, {from: firstAccount});

					assert.equal(result['unlockTime'], '1564080694', 'unlockTime should be what was passed into appendEntry()');
	  	    assert.equal(result['ipfs'], 'fake_ipfs_hash', 'ipfs hash should be what was passed into appendEntry()');
	  	    assert.equal(result['title'], 'avengers.png', 'title should be what was passed into appendEntry()');
	  	    assert.equal(result['ec_aes_key'], 'FAKE ENCRYPTED AES KEY', 'encrypted AES key should be what was passed into appendEntry()');
	  	    assert.equal(result['priv_key'], 'FAKE RSA PRIVATE KEY', 'rsa private key should be what was passed into appendEntry()');
	  	    assert.equal(result['isReleased'], false, 'isReleased should be false');
	  	});

	  	it("should increment the id counter when an entry is added", async()=> {
	  	    const tx = await instance.appendEntry("1564080694", "fake_ipfs_hash", "frasier.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount});
	  	    
	  	    const counter = await instance.counter({from: firstAccount});

	  	    assert.equal(counter, 1, 'adding an entry should increment the id counter state variable by one');
	  	});

	  	it("should not be able to add an entry if circuit breaker is turned on", async()=> {
					const tx = await instance.circuitBreaker({from: firstAccount});	  			

	  	    await catchRevert(instance.appendEntry("1564080694", "fake_ipfs_hash", "frasier.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}));
	  	});
  	});

  	describe("release()", async () => {
  		it("should emit a EventRelease event when an entry is added, flip the isReleased boolean for the correct Entry in entries and ownerToEntries mappings", async()=> {
	  	    let eventEmitted = false

	  	    const txOne = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 
	  	    const txTwo = await instance.release(1, {from: firstAccount});

	  	    if (txTwo.logs[0].event == "EventRelease") {
	  	        eventEmitted = true;
	  	    }

	  	    assert.equal(eventEmitted, true, 'releasing an entry should emit a EventRelease event');

	  	    const result = await instance.getEntry(1, {from: firstAccount});

	  	    assert.equal(result['isReleased'], true, 'isReleased should be true');

					const resultTwo = await instance.getSenderEntries({from: firstAccount});	  	    

					assert.equal(resultTwo[0]['isReleased'], true, 'isReleased should from getSenderEntries() should be true');
	  	});

  		it("should not be able to release an entry if circuit breaker is turned on", async()=> {
					const txOne = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 
					const txTwo = await instance.circuitBreaker({from: firstAccount});	  			

	  	    await catchRevert(instance.release(1, {from: firstAccount}));
	  	});

  		it("should not be able to release an entry from a non-owner account", async()=> {
					const tx = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 

	  	    await catchRevert(instance.release(1, {from: secondAccount}));
	  	});
  	});

  	describe("getEntry()", async () => {
  		it("should be able to fetch an entry", async()=> {
					const tx = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 

	  	    const result = await instance.getEntry(1, {from: firstAccount});

	  	    assert.equal(result['unlockTime'], '1564080694', 'unlockTime should be what was passed into appendEntry()');
	  	    assert.equal(result['ipfs'], 'fake_ipfs_hash', 'ipfs hash should be what was passed into appendEntry()');
	  	    assert.equal(result['title'], 'avengers.png', 'title should be what was passed into appendEntry()');
	  	    assert.equal(result['ec_aes_key'], 'FAKE ENCRYPTED AES KEY', 'encrypted AES key should be what was passed into appendEntry()');
	  	    assert.equal(result['priv_key'], 'FAKE RSA PRIVATE KEY', 'rsa private key should be what was passed into appendEntry()');
	  	});

  		it("should not be able to fetch an entry if circuit breaker is turned on", async()=> {
					const txOne = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 
					const txTwo = await instance.circuitBreaker({from: firstAccount});	  			

	  	    await catchRevert(instance.getEntry(1, {from: firstAccount}));
	  	});

  		it("should not be able to fetch an entry from a non-owner account", async()=> {
					const tx = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 

	  	    await catchRevert(instance.getEntry(1, {from: secondAccount}));
	  	});
		});  		

  	describe("getSenderEntries()", async () => {
  		it("should be able to fetch the owner's entries", async()=> {
					const txOne = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 
					const txTwo = await instance.appendEntry("1564038492", "second_fake_ipfs_hash", "frasier.png", "SECOND FAKE ENCRYPTED AES KEY", "SECOND FAKE RSA PRIVATE KEY", {from: firstAccount}); 

					const result = await instance.getSenderEntries({from: firstAccount});

	  	    assert.equal(result.length, 2, 'the number of entries fetched should be two');
	  	});

  		it("should not be able to fetch the owner's entries if circuit breaker is turned on", async()=> {
					const txOne = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 
					const txTwo = await instance.circuitBreaker({from: firstAccount});	  			

	  	    await catchRevert(instance.getSenderEntries({from: firstAccount}));
	  	});
		}); 

		describe("getTotalEntries()", async () => {
			it("should be able to fetch the total count of entries in the contract", async()=> {
					// Add 3 entries from 2 accounts
					const txOne = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 
					const txTwo = await instance.appendEntry("1564038492", "second_fake_ipfs_hash", "frasier.png", "SECOND FAKE ENCRYPTED AES KEY", "SECOND FAKE RSA PRIVATE KEY", {from: firstAccount}); 
					const txThree = await instance.appendEntry("1564038429", "third_fake_ipfs_hash", "himym.png", "THIRD FAKE ENCRYPTED AES KEY", "THIRD FAKE RSA PRIVATE KEY", {from: secondAccount}); 

	  	    const result = await instance.getTotalEntries({from: firstAccount});

	  	    assert.equal(result, 3, 'the entry count should be 3');
	  	});

			it("should not be able to fetch the count if circuit breaker is turned on", async()=> {
					const txOne = await instance.appendEntry("1564080694", "fake_ipfs_hash", "avengers.png", "FAKE ENCRYPTED AES KEY", "FAKE RSA PRIVATE KEY", {from: firstAccount}); 
					const txTwo = await instance.circuitBreaker({from: firstAccount});	  			

	  	    await catchRevert(instance.getTotalEntries({from: firstAccount}));
	  	});
		}); 
  });
});