import React, { Component } from "react";
import { connect } from 'react-redux';
import { loadWeb3, loadContract, loadCurrentAddress, loadAccounts } from './actions';
import FileUpload from "./components/FileUpload";
import ListEntries from "./components/ListEntries";
import getWeb3 from "./utils/getWeb3";
import TimeCapsuleContract from "./contracts/TimeCapsule.json";

import "./App.css";

class App extends Component {
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
      this.props.loadWeb3(web3);
      this.props.loadContract(instance);
      this.props.loadAccounts(accounts);
      this.props.loadCurrentAddress(accounts[0]);
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
          t.props.loadCurrentAddress(accounts[0]);
        })
      }
    } catch (error) {
      alert(
        `Failed to register Metamask account change. Check console for details.`,
      );
      console.error(error);
    }
  }

  render() {
    if (!this.props.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <div className="App">
        <h1>Time Capsule</h1>
          <FileUpload />
          <ListEntries />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return { web3: state.web3, currentAddress: state.currentAddress };
};

export default connect(
  mapStateToProps,
  { loadWeb3, loadContract, loadCurrentAddress, loadAccounts }
)(App);