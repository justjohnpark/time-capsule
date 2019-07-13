import React from 'react';
import TimeCapsuleContract from "../contracts/TimeCapsule.json";
import getWeb3 from "../utils/getWeb3";

const Context = React.createContext('ethereum');

export class EthereumStore extends React.Component {
  state = { web3: null, accounts: null, contract: null, strippedEntriesByID: {}, tableBody: null, image: null, currentAddress: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = TimeCapsuleContract.networks[networkId];
      const instance = new web3.eth.Contract(
        TimeCapsuleContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, currentAddress: accounts[0] });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  componentDidUpdate = async () => {
    let t = this;

    try {
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', function (accounts) {
          t.setState({ currentAddress: accounts[0] });
        })
      }
    } catch (error) {
      alert(
        `Failed to register Metamask account change. Check console for details.`,
      );
      console.error(error);
    }
  }

  updateStrippedEntriesByID = (newStrippedEntry) => {
    var sebid = {...this.state.strippedEntriesByID}
    sebid[newStrippedEntry['id']] = newStrippedEntry;
    this.setState({ strippedEntriesByID: sebid });
  }

  setTableBody = (newTableBody) => {
    this.setState({ tableBody: newTableBody });
  }

  setImage = (image) => {
    this.setState({ image }); 
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Context.Provider
        value={{ ...this.state, updateStrippedEntriesByID: this.updateStrippedEntriesByID, setTableBody: this.setTableBody, setImage: this.setImage }}
      >
        {this.props.children}
      </Context.Provider>
    );
  }
}

export default Context;