import React, { Component } from "react";
import { EthereumStore } from './contexts/EthereumContext';
import FileUpload from "./components/FileUpload";
import ListEntries from "./components/ListEntries";

import "./App.css";

class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>Time Capsule</h1>
        <EthereumStore>
          <FileUpload />
          <ListEntries />
        </EthereumStore>
      </div>
    );
  }
}

export default App;
