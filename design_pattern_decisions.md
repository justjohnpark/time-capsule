Design Patter Decisions

1) Restrict Access:
	
	The only public state variables in the contract are:
		- contractPaused: the boolean that designates whether circuit breaker is turned on/off
		- contractOwner: address of the contract owner
		- counter: unique identifier for Entry struct
	The other state variables that contain sensitive information are marked as private to prevent easy access. For the functions that has access to these private state variables - release(), getEntry(), getSenderEntries() - I've added modifiers so that only the owners/creators can read their entries from the contract. As for the functions that initiates the circuit breaker or self destructs the contract, I've added a modifier so that only the contract owner can call these methods. 

	There is an issue with restricting access to the private keys for each Entry struct (even if they're marked as private state variables) since all data is not really "private" on the blockchain. For further info on this particular issue, please read the README.md documentation

2) Circuit Breaker / Emergency Stop Pattern:

	In case there's some unforeseen bugs discovered in this contract, I've implemented a circuit breaker. There's a public state variable whose value can be flipped when the contract owner calls the circuitBreaker function. Once the variable's boolean state is flipped to true, any function that modifies or even reads state state - appendEntry(), release(), getEntry(), getSenderEntries(), and getTotalEntries are prevented from running because it will fail to get past the checkIfPaused() modifier tacked onto each of these functions

3) Mortal / Self Destruct

	For a more drastic measure on top of a circuit breaker, in case there's some unforeseen bugs discovered in the contract (or any other reason one would wish to deactiviate a contract from being accessible on the public ethereum blockchain such as a major version upgrade), I've implemented a function that will self destruct the contract. The close() function has a modifier in place so that only the contract owner can call it. 