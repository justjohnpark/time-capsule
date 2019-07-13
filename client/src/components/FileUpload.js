import React from 'react';
import NodeRSA from 'node-rsa';
// import CryptoJS from 'crypto-js';

import { Buffer } from 'buffer';
import EthereumContext from '../contexts/EthereumContext';
import ipfs from '../ipfs/ipfs';
import keys from '../utils/keys';

class FileUpload extends React.Component {
  static contextType = EthereumContext;

  constructor(props) {
    super(props);
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

    ipfs.add(encryptedBuffer, (err, result) => {
      // generate RSA public/private key pair 
      let keyPair = keys.generatePubPrivKeyPair();

      // encrypt aesKey using private key 
      let nrsa = new NodeRSA(keyPair[1]);
      let ecAesKey = nrsa.encrypt(key, 'base64');

      if (!err) {
        this.context.contract.methods.appendEntry(this.state.unlockTime, result[0].path, this.state.title, ecAesKey, keyPair[1]).send({from: this.context.accounts[0]});
        this.listenToAppendEntryEvent();
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

  releaseEntry(id) {
    console.log(`id: ${id}`);
    this.context.contract.methods.release(parseInt(id)).send({from: this.context.accounts[0]});
    this.listenToReleaseEntryEvent();
  }

  listenToAppendEntryEvent() {
    let t = this;

    this.context.contract.events.EventEntry({fromBlock: 0, toBlock: 'latest'})
      .on('data', function(event) {
        console.log(`EventEntry received: ${event} || ${event.returnValues}`);
        console.log(event.returnValues);

        if (!t.context.strippedEntriesByID[event.returnValues['id']]) {
          var newEntry = {
            'id' : event.returnValues['id'],
            'title' : event.returnValues['title'],
            'ipfs hash' : event.returnValues['ipfs'],
            'released' : event.returnValues['isReleased'].toString(),
            'unlockTime' : event.returnValues['unlockTime']
          }

          console.log(t.buildTableBody());

          t.context.updateStrippedEntriesByID(newEntry);
          t.context.setTableBody(t.buildTableBody());
        }
      })
      .on('error', console.error);
  };

  listenToReleaseEntryEvent() {
    let t = this;

    this.context.contract.events.EventRelease({fromBlock: 0, toBlock: 'latest'})
      .on('data', function(event) {
        console.log(`EventRelease received: ${event} || ${event.returnValues}`);
        console.log(event.returnValues);

        let tse = t.context.strippedEntriesByID[event.returnValues['id']];
        if (tse) {
          tse['released'] = 'true';
          tse['priv_key'] = event.returnValues['priv_key'];
          tse['ec_aes_key'] = event.returnValues['ec_aes_key'];
          t.context.updateStrippedEntriesByID(tse);
          t.context.setTableBody(t.buildTableBody());
        }
      })
      .on('error', console.error);
  };

  releaseEntry = (e) => {
    console.log(parseInt(e.currentTarget.getAttribute('value')));
    this.context.contract.methods.release(parseInt(e.currentTarget.getAttribute('value'))).send({from: this.context.accounts[0]});
    this.listenToReleaseEntryEvent();
  }

  decryptIPFS = (e) => {
    var entry = this.context.strippedEntriesByID[parseInt(e.currentTarget.getAttribute('value'))];

    ipfs.cat(entry['ipfs hash'], (err, r) => {
      let z = new NodeRSA(entry['priv_key']);
      let dcAesKey = z.decrypt(entry['ec_aes_key'], 'utf8');

      var decryptedWordArray = keys.decryptToWordArray(r, dcAesKey);
      var decryptedArrayBuffer = keys.convertWordArrayToArrayBuffer(decryptedWordArray);

      var imageUrl = keys.convertArrayBufferToImage(decryptedArrayBuffer);
      this.context.setImage(imageUrl);
    });
  }

  buildTableBody() {
    let tableBody = [];
    let sebid = this.context.strippedEntriesByID;

    if (Object.keys(sebid).length > 0) {
      for (var key in sebid) {
        if (sebid[key]['released'] === 'true') {
          tableBody.push(
            <tr key={`${key}`}>
              <td>{sebid[key]['title']}</td>
              <td>
                <a value={key} href="#" onClick={(e) => this.decryptIPFS(e)}>
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
    if (this.context.currentAddress != null || this.context.currentAddress != '') {
      var displayCurrentAddress = <h4>Current Metamask Address: {this.context.currentAddress}</h4>
    } else {
      var displayCurrentAddress = null;
    }

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

export default FileUpload;