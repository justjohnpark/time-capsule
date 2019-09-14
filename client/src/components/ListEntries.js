import React from 'react';
import { connect } from 'react-redux';
import ipfs from '../ipfs/ipfs';
import keys from '../utils/keys';
import NodeRSA from 'node-rsa';

import { loadImage, setSebid, setTableBody } from '../actions';

class ListEntries extends React.Component {

  constructor() {
    super()

    this.state = {
      fetchedEntries: false,
    }
  }

  componentDidMount() {
  	try {
      this.interval = setInterval(this.fetchEntries, 1000);
  	} catch (error) {
  		console.log(error);
  	}
  }

  fetchEntries = async() => {
    if (this.state.fetchedEntries === true) {
      clearInterval(this.interval);
    }

    if (this.props && this.props.contract && this.props.contract.contract) {
      var result = await this.props.contract.contract.methods.getSenderEntries().call({from: this.props.accounts.accounts[0]});

      if (result.length > 0) {
        let t = this;
      
        var tempEntry = {};

        result.forEach(entry => {
          tempEntry['id'] = entry['id'];
          tempEntry['title'] = entry['title'];
          tempEntry['ipfs hash'] = entry['ipfs'];
          tempEntry['released'] = entry['isReleased'].toString();
          tempEntry['unlockTime'] = entry['unlockTime'];

          if (entry['isReleased'].toString() === 'true') {
            tempEntry['ec_aes_key'] = entry['ec_aes_key'];
            tempEntry['priv_key'] = entry['priv_key'];
          }

          if (!t.props.sebid.sebid || !t.props.sebid.sebid[tempEntry['id']]) {
            t.updateStrippedEntriesByID(tempEntry);
          }

          tempEntry = {};
        });

        this.props.setTableBody(this.buildTableBody());
      }
      
      this.state.fetchedEntries = true;
    }
  }

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
	        t.updateStrippedEntriesByID(tse);
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

  decryptIPFS = (e) => {
  	var entry = this.props.sebid.sebid[parseInt(e.currentTarget.getAttribute('value'))];

    let t = this;

	  ipfs.cat(entry['ipfs hash'], (err, r) => {
	  	let z = new NodeRSA(entry['priv_key']);
	  	let dcAesKey = z.decrypt(entry['ec_aes_key'], 'utf8');

	    var decryptedWordArray = keys.decryptToWordArray(r, dcAesKey);
	    var decryptedArrayBuffer = keys.convertWordArrayToArrayBuffer(decryptedWordArray);

	    var imageUrl = keys.convertArrayBufferToImage(decryptedArrayBuffer);
	    t.props.loadImage(imageUrl);
	  });
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

  displayImage() {
    if (this.props.image && this.props.image.image) {
      return this.props.image.image
    } else {
      return null;
    }
  }

  displayTableBody() {
    if (this.props.tableBody && this.props.tableBody.tableBody) {
      return this.props.tableBody.tableBody
    } else {
      return null;
    }
  }

  updateStrippedEntriesByID(newStrippedEntry) {
    var updatedSebid = {...this.props.sebid.sebid}
    updatedSebid[newStrippedEntry['id']] = newStrippedEntry;
    this.props.setSebid(updatedSebid);
  }

  render() {
  	return (
  		<div>
  			<table align="center">
  				<thead key="thead">
						<tr>
							<th>Title</th>
							<th>IPFS Hash</th>
							<th>Released</th>
							<th>Release Date</th>
						</tr>
  				</thead>
  				<tbody key="tbody">
						{this.displayTableBody()}
  				</tbody>
  			</table>

  			<img src={this.displayImage()} />
      </div>
  	)
  }
}

const mapStateToProps = (state) => {
  return { contract: state.contract, accounts: state.accounts, image: state.image, sebid: state.sebid, tableBody: state.tableBody };
};

export default connect(
  mapStateToProps,
  { loadImage, setSebid, setTableBody }
)(ListEntries);