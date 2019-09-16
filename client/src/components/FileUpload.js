import React from 'react';
import { connect } from 'react-redux';
import NodeRSA from 'node-rsa';
import { Buffer } from 'buffer';
// import CryptoJS from 'crypto-js';

import ipfs from '../ipfs/ipfs';
import keys from '../utils/keys';
import util from '../utils/index';
import { setSebid, setTableBody } from '../actions';

class FileUpload extends React.Component {
  
  constructor(props) {
    super();

    this.state = {
      file: null,
      image: null,
      title: '',
      unlockTime: 0
    }

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUpload = this.fileUpload.bind(this);
  }

  onFormSubmit(e) {
    e.preventDefault() // Stop form submit

    this.fileUpload(this.state.file)
    // this.fileUpload(this.state.file).then((response) => {
    //   console.log(response.data);
    // })
  }

  onChange(e) {
    let my = this;
    var f = e.target.files[0];
    var reader = new FileReader();
    reader.readAsArrayBuffer(f);
    reader.onload = function(e) {
      my.setState({ file: { file: f, data: e.target.result }}); 
    };
    reader.onloadend = () => this.convertToBuffer(reader);
  }

  fileUpload(file) {
    // RSA is very computationally expensive by comparison with AES. It involves mathematics with very large numbers, whilst AES can be implemented with relatively simple bit operations. 
    // The larger the data, the more you feel the pain. A good compromise is to use RSA to encrypt the symmetric key that is then used in AES encryption of the larger data.
    var key = keys.generateRandomKey();
    var wordArray = keys.convertArrayBufferToWordArray(this.state.buffer);
    var aesEncrypted = keys.encryptWordArray(wordArray, key);
    var encryptedBuffer = new Buffer(aesEncrypted);

    let t = this;

    ipfs.add(encryptedBuffer, (err, result) => {
      // generate RSA public/private key pair 
      let keyPair = keys.generatePubPrivKeyPair();

      // encrypt aesKey using private key 
      let nrsa = new NodeRSA(keyPair[1]);
      let ecAesKey = nrsa.encrypt(key, 'base64');

      if (!err) {
        t.props.contract.contract.methods.appendEntry(t.state.unlockTime, result[0].path, t.state.title, ecAesKey, keyPair[1]).send({from: t.props.accounts.accounts[0]});
        t.listenToAppendEntryEvent();
      }
    });
  }

  convertToBuffer = async(reader) => {
    const buffer = await Buffer.from(reader.result);
    this.setState({ buffer });
  };

  convertToUTC(toConvert) {
    var toUTC = (new Date(toConvert).getTime() / 1000);
    this.setState({ unlockTime: toUTC });
  };

  listenToAppendEntryEvent() {
    let t = this;

    this.props.contract.contract.events.EventEntry({fromBlock: 0, toBlock: 'latest'})
      .on('data', function(event) {
        console.log(`EventEntry received: ${event} || ${event.returnValues}`);
        console.log(event.returnValues);

        if (!t.props.sebid.sebid || !t.props.sebid.sebid[event.returnValues['id']]) {
          var newEntry = {
            'id' : event.returnValues['id'],
            'title' : event.returnValues['title'],
            'ipfs hash' : event.returnValues['ipfs'],
            'released' : event.returnValues['isReleased'].toString(),
            'unlockTime' : event.returnValues['unlockTime']
          }

          util.updateStrippedEntriesByID(newEntry);
          t.props.setTableBody(t.buildTableBody());
        }
      })
      .on('error', console.error);
  };

  listenToReleaseEntryEvent() {
    let t = this;

    this.props.contract.contract.events.EventRelease({fromBlock: 0, toBlock: 'latest'})
      .on('data', function(event) {
        console.log(`EventRelease received: ${event} || ${event.returnValues}`);
        console.log(event.returnValues);

        let tse = t.props.sebid.sebid[event.returnValues['id']];
        if (tse) {
          tse['released'] = 'true';
          tse['priv_key'] = event.returnValues['priv_key'];
          tse['ec_aes_key'] = event.returnValues['ec_aes_key'];
          util.updateStrippedEntriesByID(tse);
          t.props.setTableBody(t.buildTableBody());
        }
      })
      .on('error', console.error);
  };

  releaseEntry = (e) => {
    console.log(parseInt(e.currentTarget.getAttribute('value')));
    this.props.contract.contract.methods.release(parseInt(e.currentTarget.getAttribute('value'))).send({from: this.props.accounts.accounts[0]});
    this.listenToReleaseEntryEvent();
  }

  buildTableBody() {
    let tableBody = [];
    let sebid = this.props.sebid.sebid;

    if (Object.keys(sebid).length > 0) {
      for (var key in sebid) {
        if (sebid[key]['released'] === 'true') {
          tableBody.push(
            <tr key={`${key}`}>
              <td>{sebid[key]['title']}</td>
              <td>
                <a value={key} href="#" onClick={(e) => util.decryptIPFS(e)}>
                  {sebid[key]['ipfs hash']}
                </a>
              </td>
              <td>{sebid[key]['released']}</td>
              <td>{new Date(parseInt(sebid[key]['unlockTime'])*1000).toUTCString()}</td>
            </tr>
          );
        } else {
          tableBody.push(
            <tr key={`${key}`}>
              <td>{sebid[key]['title']}</td>
              <td>{sebid[key]['ipfs hash']}</td>
              <td>
                <a value={key} href="#" onClick={(e) => this.releaseEntry(e)}>
                  {sebid[key]['released']}
                </a>
              </td>
              <td>{new Date(parseInt(sebid[key]['unlockTime'])*1000).toUTCString()}</td>
            </tr>
          );
        }
      }
    }

    return tableBody;
  }

  render() {
    if (this.props.currentAddress != null || this.props.currentAddress != '') {
      var displayCurrentAddress = <h4>Current Metamask Address: {this.props.currentAddress}</h4>
    } else {
      var displayCurrentAddress = null;
    }

    // util.testFunction()

    return (
      <div className="FileUpload">
        {displayCurrentAddress}

        <form onSubmit={this.onFormSubmit}>
          <h3>Upload Entry</h3>
          Title: <input type="text" name="title" onChange={event => this.setState({ title: event.target.value })} /><br />
          Unlock Date (UTC): <input type="date" name="unlockTime" onChange={event => this.convertToUTC(event.target.value)} /><br />
          <input type="file" onChange={this.onChange} /><br />
          <button type="submit">Upload</button>
        </form>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return { currentAddress: state.currentAddress, contract: state.contract, accounts: state.accounts, image: state.image, sebid: state.sebid, tableBody: state.tableBody };
};

export default connect(
  mapStateToProps, 
  { setSebid, setTableBody }
)(FileUpload);