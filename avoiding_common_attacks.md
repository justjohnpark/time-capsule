Avoiding Common Attacks

1) Integer Overflow and Underflow

	Integers can underflow or overflow in the EVM. In order to avoid complications/attacks that arise from this vulnerability, the contract imports the openzeppelin's SafeMath library to use uint256 for the entry counter, timestamps, and other variables and their .add() and .sub() methods to change their values. 

2) Transaction Ordering and Timestamp Dependence

	This application is meant to resemble a time capsule for images. The contract stores important info about each image and relies on timestamps to determine when to release the sensitive info for each image. Since transactions are in a mempool that everyone can see before miners decide which transactions to include in a block, there's some weird complications/attacks that arise from the fact that mining takes 10 to 20 seconds for each block. There's two things I did to avoid any issues that might arise from using timestamps on the ethereum blockchain. First, I smallest unit of time I used to designate whether an image should be decrypted or not on the UI is the day. So even if an attack released an image 20 seconds earlier, it shouldn't be too big a concern. This is probably overkill, but I've also added a modifier for the release() method that adds a five minute wiggle room. Again, since the user understands that the smallest unit of time to designate an image as encrypted or decrypted is a day, this 5 minute wiggle room shouldn't be too big of a concern. 

