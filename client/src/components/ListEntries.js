import React from 'react';
import ipfs from '../ipfs/ipfs';
import keys from '../utils/keys';
import NodeRSA from 'node-rsa';

import EthereumContext from '../contexts/EthereumContext';

class ListEntries extends React.Component {
  static contextType = EthereumContext;

  async componentDidMount() {
  	try {
	  	var result = await this.context.contract.methods.getSenderEntries().call({from: this.context.accounts[0]});

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

	  			if (!t.context.strippedEntriesByID[tempEntry['id']]) {
		  			t.context.updateStrippedEntriesByID(tempEntry);
	  			}

	  			tempEntry = {};
	  		});

	  		this.context.setTableBody(this.buildTableBody());
	  	}
  	} catch (error) {
  		console.log(error);
  	}
  }

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
						{this.context.tableBody}
  				</tbody>
  			</table>

  			<img src={this.context.image} />
      </div>
  	)
  }
}

export default ListEntries;